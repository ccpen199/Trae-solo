import React, { useState, useMemo } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Button,
  Space,
  Tree,
  Tag,
  Avatar,
  Drawer,
  Tabs,
  Table,
  Descriptions,
  Divider,
  Badge,
  message,
  Alert,
  Timeline,
  Progress
} from 'antd'
import {
  SearchOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DashboardOutlined,
  UnorderedListOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  SettingOutlined,
  ApiOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  BranchesOutlined,
  ToolOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import ReactECharts from 'echarts-for-react'
import { useUserStore } from '@/store/user'

const { Title, Text } = Typography
const { Option } = Select

interface Department {
  id: string
  code: string
  name: string
  category: string
  status: 'online' | 'offline' | 'maintenance'
  level: 'A' | 'B' | 'C'
  todayCalls: number
  totalCalls: number
  avgResponseTime: number
  successRate: number
  lastSyncTime: string
  description: string
  leader: string
  phone: string
  address: string
  apiBaseUrl: string
  apiKey: string
  encryptMethod: string
  interfaces: ApiInterface[]
  callTrend: number[]
  recentLogs: CallLog[]
}

interface ApiInterface {
  id: string
  name: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  calls: number
  status: 'active' | 'inactive'
}

interface CallLog {
  id: string
  time: string
  interfaceName: string
  status: 'success' | 'fail'
  duration: number
  caller: string
}

const departmentCategories = [
  { key: 'gong-an', title: '公安类', icon: '🛡️' },
  { key: 'ren-she', title: '人社类', icon: '👥' },
  { key: 'min-zheng', title: '民政类', icon: '🏠' },
  { key: 'shi-chang', title: '市场监管类', icon: '🏪' },
  { key: 'jiao-tong', title: '交通类', icon: '🚗' },
  { key: 'wei-jian', title: '卫健类', icon: '🏥' },
  { key: 'jiao-yu', title: '教育类', icon: '🎓' },
  { key: 'zi-ran', title: '自然资源类', icon: '🌿' },
  { key: 'zhu-jian', title: '住建类', icon: '🏗️' },
  { key: 'shui-wu', title: '税务类', icon: '💰' },
  { key: 'qi-ta', title: '其他类', icon: '📋' }
]

const departmentTemplates: { name: string; category: string; level: 'A' | 'B' | 'C'; codePrefix: string }[] = [
  { name: '宁夏回族自治区公安厅', category: 'gong-an', level: 'A', codePrefix: 'NX-GA-001' },
  { name: '银川市公安局', category: 'gong-an', level: 'B', codePrefix: 'NX-GA-002' },
  { name: '石嘴山市公安局', category: 'gong-an', level: 'C', codePrefix: 'NX-GA-003' },
  { name: '吴忠市公安局', category: 'gong-an', level: 'C', codePrefix: 'NX-GA-004' },
  { name: '固原市公安局', category: 'gong-an', level: 'C', codePrefix: 'NX-GA-005' },
  { name: '中卫市公安局', category: 'gong-an', level: 'C', codePrefix: 'NX-GA-006' },
  { name: '宁夏回族自治区人力资源和社会保障厅', category: 'ren-she', level: 'A', codePrefix: 'NX-RS-001' },
  { name: '宁夏回族自治区社会保险事业管理局', category: 'ren-she', level: 'B', codePrefix: 'NX-RS-002' },
  { name: '宁夏回族自治区民政厅', category: 'min-zheng', level: 'B', codePrefix: 'NX-MZ-001' },
  { name: '宁夏回族自治区退役军人事务厅', category: 'min-zheng', level: 'C', codePrefix: 'NX-MZ-002' },
  { name: '宁夏回族自治区乡村振兴局', category: 'min-zheng', level: 'C', codePrefix: 'NX-MZ-003' },
  { name: '宁夏回族自治区市场监督管理厅', category: 'shi-chang', level: 'A', codePrefix: 'NX-SC-001' },
  { name: '宁夏回族自治区药品监督管理局', category: 'shi-chang', level: 'C', codePrefix: 'NX-SC-002' },
  { name: '宁夏回族自治区知识产权局', category: 'shi-chang', level: 'C', codePrefix: 'NX-SC-003' },
  { name: '宁夏回族自治区交通运输厅', category: 'jiao-tong', level: 'B', codePrefix: 'NX-JT-001' },
  { name: '宁夏回族自治区公安厅交通管理局', category: 'jiao-tong', level: 'A', codePrefix: 'NX-JT-002' },
  { name: '宁夏回族自治区卫生健康委员会', category: 'wei-jian', level: 'A', codePrefix: 'NX-WJ-001' },
  { name: '宁夏回族自治区医疗保障局', category: 'wei-jian', level: 'B', codePrefix: 'NX-WJ-002' },
  { name: '宁夏回族自治区中医药管理局', category: 'wei-jian', level: 'C', codePrefix: 'NX-WJ-003' },
  { name: '宁夏回族自治区教育厅', category: 'jiao-yu', level: 'B', codePrefix: 'NX-JY-001' },
  { name: '宁夏回族自治区自然资源厅', category: 'zi-ran', level: 'B', codePrefix: 'NX-ZR-001' },
  { name: '宁夏回族自治区林业和草原局', category: 'zi-ran', level: 'C', codePrefix: 'NX-ZR-002' },
  { name: '宁夏回族自治区水利厅', category: 'zi-ran', level: 'C', codePrefix: 'NX-ZR-003' },
  { name: '宁夏回族自治区住房和城乡建设厅', category: 'zhu-jian', level: 'B', codePrefix: 'NX-ZJ-001' },
  { name: '宁夏回族自治区人民防空办公室', category: 'zhu-jian', level: 'C', codePrefix: 'NX-ZJ-002' },
  { name: '国家税务总局宁夏回族自治区税务局', category: 'shui-wu', level: 'A', codePrefix: 'NX-SW-001' },
  { name: '宁夏回族自治区发展和改革委员会', category: 'qi-ta', level: 'B', codePrefix: 'NX-QT-001' },
  { name: '宁夏回族自治区财政厅', category: 'qi-ta', level: 'B', codePrefix: 'NX-QT-002' },
  { name: '宁夏回族自治区应急管理厅', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-003' },
  { name: '宁夏回族自治区农业农村厅', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-004' },
  { name: '宁夏回族自治区文化和旅游厅', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-005' },
  { name: '宁夏回族自治区统计局', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-006' },
  { name: '宁夏回族自治区审计厅', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-007' },
  { name: '宁夏回族自治区生态环境厅', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-008' },
  { name: '宁夏回族自治区商务厅', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-009' },
  { name: '宁夏回族自治区外事办公室', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-010' },
  { name: '宁夏回族自治区司法厅', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-011' },
  { name: '宁夏回族自治区广播电视局', category: 'qi-ta', level: 'C', codePrefix: 'NX-QT-012' }
]

const generateRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const generateDepartmentData = (): Department[] => {
  return departmentTemplates.map((template, index) => {
    const baseCalls = template.level === 'A' ? 10000 : template.level === 'B' ? 6000 : 2500
    const todayCalls = generateRandomInt(baseCalls * 0.7, baseCalls * 1.2)
    const isOffline = index === 17 || index === 28
    const isMaintenance = index === 14

    return {
      id: String(index + 1),
      code: template.codePrefix,
      name: template.name,
      category: template.category,
      status: isOffline ? 'offline' : isMaintenance ? 'maintenance' : 'online',
      level: template.level,
      todayCalls: isOffline || isMaintenance ? 0 : todayCalls,
      totalCalls: generateRandomInt(500000, 15000000),
      avgResponseTime: isOffline || isMaintenance ? 0 : generateRandomInt(50, 180),
      successRate: isOffline || isMaintenance ? 0 : parseFloat((97 + Math.random() * 3).toFixed(1)),
      lastSyncTime: isOffline ? '2026-06-14 14:30:00' : isMaintenance ? '2026-06-15 18:00:00' : '2026-06-16 09:30:00',
      description: `负责${template.name.replace('宁夏回族自治区', '全区')}相关工作`,
      leader: ['张局长', '李厅长', '王主任', '刘局长', '陈厅长', '赵主任', '周局长'][index % 7],
      phone: `0951-${generateRandomInt(1000000, 9999999)}`,
      address: '银川市兴庆区解放西街' + generateRandomInt(1, 300) + '号',
      apiBaseUrl: `https://api-gov.nx.gov.cn/dept-${index + 1}/api`,
      apiKey: `NX-DEPT-${index + 1}-********`,
      encryptMethod: 'SM4',
      interfaces: [
        { id: `${index}-i1`, name: '基础信息查询', path: '/api/info/query', method: 'POST', calls: generateRandomInt(1000, 5000), status: 'active' },
        { id: `${index}-i2`, name: '业务办理查询', path: '/api/business/query', method: 'GET', calls: generateRandomInt(800, 4000), status: 'active' },
        { id: `${index}-i3`, name: '数据统计接口', path: '/api/statistics', method: 'GET', calls: generateRandomInt(300, 2000), status: index % 3 === 0 ? 'inactive' : 'active' }
      ],
      callTrend: [
        generateRandomInt(baseCalls * 0.6, baseCalls * 0.9),
        generateRandomInt(baseCalls * 0.7, baseCalls * 1.0),
        generateRandomInt(baseCalls * 0.8, baseCalls * 1.1),
        generateRandomInt(baseCalls * 0.7, baseCalls * 1.0),
        generateRandomInt(baseCalls * 0.8, baseCalls * 1.15),
        generateRandomInt(baseCalls * 0.9, baseCalls * 1.2),
        isOffline || isMaintenance ? 0 : todayCalls
      ],
      recentLogs: [
        { id: `${index}-l1`, time: '09:28:15', interfaceName: '基础信息查询', status: 'success', duration: generateRandomInt(50, 150), caller: '政务服务网' },
        { id: `${index}-l2`, time: '09:27:42', interfaceName: '业务办理查询', status: index % 5 === 0 ? 'fail' : 'success', duration: generateRandomInt(60, 180), caller: '我的宁夏APP' },
        { id: `${index}-l3`, time: '09:26:18', interfaceName: '基础信息查询', status: 'success', duration: generateRandomInt(40, 120), caller: '政务服务网' }
      ]
    }
  })
}

const departmentsData = generateDepartmentData()

const Departments: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  const treeData: DataNode[] = useMemo(() => {
    return [
      {
        key: 'all',
        title: (
          <span>
            <BranchesOutlined style={{ marginRight: 8 }} />
            全部委办局
            <Tag color="blue" style={{ marginLeft: 8 }}>{departmentsData.length}</Tag>
          </span>
        ),
        children: departmentCategories.map((cat) => {
          const count = departmentsData.filter((d) => d.category === cat.key).length
          return {
            key: cat.key,
            title: (
              <span>
                {cat.icon} {cat.title}
                <Tag style={{ marginLeft: 8 }}>{count}</Tag>
              </span>
            ),
            isLeaf: true
          }
        })
      }
    ]
  }, [])

  const filteredDepartments = useMemo(() => {
    return departmentsData.filter((dept) => {
      const matchSearch = dept.name.includes(searchText) || dept.code.toLowerCase().includes(searchText.toLowerCase())
      const matchStatus = statusFilter === 'all' || dept.status === statusFilter
      const matchLevel = levelFilter === 'all' || dept.level === levelFilter
      const matchCategory = categoryFilter === 'all' || dept.category === categoryFilter
      return matchSearch && matchStatus && matchLevel && matchCategory
    })
  }, [searchText, statusFilter, levelFilter, categoryFilter])

  const statistics = useMemo(() => {
    const total = departmentsData.length
    const onlineCount = departmentsData.filter((d) => d.status === 'online').length
    const onlineRate = ((onlineCount / total) * 100).toFixed(1)
    const totalTodayCalls = departmentsData.reduce((sum, d) => sum + d.todayCalls, 0)
    const avgSuccessRate = (
      departmentsData.filter((d) => d.status === 'online').reduce((sum, d) => sum + d.successRate, 0) /
      Math.max(onlineCount, 1)
    ).toFixed(1)
    return { total, onlineCount, onlineRate, totalTodayCalls, avgSuccessRate }
  }, [])

  const handleTreeSelect = (keys: React.Key[]) => {
    setSelectedKeys(keys as string[])
    if (keys.length > 0 && keys[0] !== 'all') {
      setCategoryFilter(keys[0] as string)
    } else {
      setCategoryFilter('all')
    }
  }

  const { userInfo } = useUserStore()
  const currentRole = useMemo(() => {
    const roles = userInfo?.roles || []
    if (roles.includes('超级管理员')) return 'admin'
    if (roles.includes('委办局管理员')) return 'dept_admin'
    if (roles.includes('窗口办事员')) return 'clerk'
    if (roles.includes('审计员')) return 'auditor'
    return 'default'
  }, [userInfo?.roles])
  const isAdminOrManager = currentRole === 'admin' || currentRole === 'dept_admin'

  const handleViewDetail = (dept: Department) => {
    setSelectedDepartment(dept)
    setDrawerVisible(true)
  }

  const handleTestConnection = (dept: Department) => {
    message.loading({ content: '正在测试连接...', key: 'test-conn' })
    setTimeout(() => {
      if (dept.status === 'online') {
        message.success({ content: '连接测试成功！响应时间: ' + dept.avgResponseTime + 'ms', key: 'test-conn' })
      } else if (dept.status === 'maintenance') {
        message.warning({ content: '连接失败：系统维护中', key: 'test-conn' })
      } else {
        message.error({ content: '连接失败：系统离线', key: 'test-conn' })
      }
    }, 1000)
  }

  const handleSyncData = (_dept: Department) => {
    message.loading({ content: '正在同步数据...', key: 'sync-data' })
    setTimeout(() => {
      message.success({ content: '数据同步完成！', key: 'sync-data' })
    }, 1500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success'
      case 'offline':
        return 'error'
      case 'maintenance':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return '在线'
      case 'offline':
        return '离线'
      case 'maintenance':
        return '维护中'
      default:
        return '未知'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A':
        return '#ff4d4f'
      case 'B':
        return '#faad14'
      case 'C':
        return '#52c41a'
      default:
        return '#bfbfbf'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'green'
      case 'POST':
        return 'blue'
      case 'PUT':
        return 'orange'
      case 'DELETE':
        return 'red'
      default:
        return 'default'
    }
  }

  const chartOption = (data: number[]) => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['7天前', '6天前', '5天前', '4天前', '3天前', '昨天', '今天']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '调用量',
        type: 'line',
        smooth: true,
        data,
        itemStyle: { color: '#0958d9' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(9, 88, 217, 0.3)' },
              { offset: 1, color: 'rgba(9, 88, 217, 0.05)' }
            ]
          }
        }
      }
    ]
  })

  const interfaceColumns = [
    { title: '接口名称', dataIndex: 'name', key: 'name' },
    { title: '请求路径', dataIndex: 'path', key: 'path', render: (p: string) => <Text code>{p}</Text> },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      render: (m: string) => <Tag color={getMethodColor(m)}>{m}</Tag>
    },
    { title: '今日调用', dataIndex: 'calls', key: 'calls', render: (c: number) => c.toLocaleString() },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '启用' : '停用'}</Tag>
      )
    }
  ]

  const logColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 100 },
    { title: '接口名称', dataIndex: 'interfaceName', key: 'interfaceName' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={s === 'success' ? 'green' : 'red'}>{s === 'success' ? '成功' : '失败'}</Tag>
    },
    { title: '耗时(ms)', dataIndex: 'duration', key: 'duration' },
    { title: '调用方', dataIndex: 'caller', key: 'caller' }
  ]

  const tableColumns = [
    {
      title: '委办局',
      key: 'name',
      render: (_: unknown, record: Department) => (
        <Space>
          <Avatar style={{ backgroundColor: getLevelColor(record.level) }}>{record.name.charAt(0)}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag>
    },
    {
      title: '接入等级',
      dataIndex: 'level',
      key: 'level',
      render: (l: string) => <Tag color={getLevelColor(l)}>Level {l}</Tag>
    },
    { title: '今日调用', dataIndex: 'todayCalls', key: 'todayCalls', render: (v: number) => v.toLocaleString() },
    { title: '平均响应', dataIndex: 'avgResponseTime', key: 'avgResponseTime', render: (v: number) => `${v}ms` },
    { title: '成功率', dataIndex: 'successRate', key: 'successRate', render: (v: number) => `${v}%` },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Department) => (
        <Space size="small">
          {isAdminOrManager && (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              详情
            </Button>
          )}
          {currentRole === 'admin' && (
            <Button type="link" size="small" icon={<ToolOutlined />}>
              配置
            </Button>
          )}
          {!isAdminOrManager && (
            <Text type="secondary" style={{ fontSize: 12 }}>无操作权限</Text>
          )}
        </Space>
      )
    }
  ]

  const drawerTabs = [
    {
      key: 'base',
      label: '基本信息',
      icon: <FileTextOutlined />,
      children: selectedDepartment && (
        <div>
          <Descriptions title="委办局信息" bordered column={1} size="small">
            <Descriptions.Item label="委办局名称">{selectedDepartment.name}</Descriptions.Item>
            <Descriptions.Item label="机构编码">{selectedDepartment.code}</Descriptions.Item>
            <Descriptions.Item label="机构分类">
              {departmentCategories.find((c) => c.key === selectedDepartment.category)?.title}
            </Descriptions.Item>
            <Descriptions.Item label="接入等级">
              <Tag color={getLevelColor(selectedDepartment.level)}>Level {selectedDepartment.level}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="接入状态">
              <Tag color={getStatusColor(selectedDepartment.status)}>{getStatusText(selectedDepartment.status)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="负责人">{selectedDepartment.leader}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedDepartment.phone}</Descriptions.Item>
            <Descriptions.Item label="机构地址">{selectedDepartment.address}</Descriptions.Item>
            <Descriptions.Item label="机构描述">{selectedDepartment.description}</Descriptions.Item>
          </Descriptions>
          <Divider />
          <Descriptions title="运行指标" bordered column={2} size="small">
            <Descriptions.Item label="今日调用量">{selectedDepartment.todayCalls.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="累计调用量">{selectedDepartment.totalCalls.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="平均响应时间">{selectedDepartment.avgResponseTime}ms</Descriptions.Item>
            <Descriptions.Item label="成功率">{selectedDepartment.successRate}%</Descriptions.Item>
            <Descriptions.Item label="最后同步时间">{selectedDepartment.lastSyncTime}</Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: 'interfaces',
      label: '接口列表',
      icon: <ApiOutlined />,
      children: selectedDepartment && (
        <Table
          columns={interfaceColumns}
          dataSource={selectedDepartment.interfaces}
          rowKey="id"
          size="small"
          pagination={false}
        />
      )
    },
    {
      key: 'config',
      label: '接入配置',
      icon: <SettingOutlined />,
      children: selectedDepartment && (
        <Descriptions title="API接入配置" bordered column={1} size="small">
          <Descriptions.Item label="API基地址">
            <Text code copyable>{selectedDepartment.apiBaseUrl}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="API密钥">
            <Text code copyable>{selectedDepartment.apiKey}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="加密方式">
            <Tag color="blue">{selectedDepartment.encryptMethod}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="签名算法">HMAC-SM3</Descriptions.Item>
          <Descriptions.Item label="超时时间">30000ms</Descriptions.Item>
          <Descriptions.Item label="限流阈值">1000次/分钟</Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'trend',
      label: '调用趋势',
      icon: <RiseOutlined />,
      children: selectedDepartment && (
        <ReactECharts option={chartOption(selectedDepartment.callTrend)} style={{ height: 300 }} />
      )
    },
    {
      key: 'logs',
      label: '最近调用',
      icon: <UnorderedListOutlined />,
      children: selectedDepartment && (
        <Table
          columns={logColumns}
          dataSource={selectedDepartment.recentLogs}
          rowKey="id"
          size="small"
          pagination={false}
        />
      )
    },
    {
      key: 'sync-errors',
      label: '同步异常',
      icon: <WarningOutlined />,
      children: selectedDepartment && (
        <div>
          <Table
            columns={[
              { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
              { title: '接口', dataIndex: 'interface', key: 'interface' },
              { title: '异常类型', dataIndex: 'errorType', key: 'errorType', render: (t: string) => <Tag color="error">{t}</Tag> },
              { title: '影响范围', dataIndex: 'scope', key: 'scope' },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (s: string) => {
                  const config: Record<string, { color: string; text: string }> = {
                    recovered: { color: 'green', text: '已恢复' },
                    processing: { color: 'orange', text: '处理中' },
                    pending: { color: 'red', text: '待处理' }
                  }
                  const item = config[s] || { color: 'default', text: s }
                  return <Tag color={item.color}>{item.text}</Tag>
                }
              }
            ]}
            dataSource={[
              { key: 'e1', time: '2026-06-16 08:30:12', interface: '基础信息查询', errorType: '连接超时', scope: '全部接口', status: 'recovered' },
              { key: 'e2', time: '2026-06-16 07:15:33', interface: '业务办理查询', errorType: '数据格式错误', scope: '查询接口', status: 'processing' },
              { key: 'e3', time: '2026-06-15 22:45:18', interface: '数据统计接口', errorType: '权限拒绝', scope: '统计接口', status: 'pending' },
              { key: 'e4', time: '2026-06-15 18:20:05', interface: '基础信息查询', errorType: '响应超时', scope: '查询接口', status: 'recovered' },
              { key: 'e5', time: '2026-06-15 10:10:42', interface: '业务办理查询', errorType: '证书过期', scope: '全部接口', status: 'processing' }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />
        </div>
      )
    },
    {
      key: 'responsibility',
      label: '责任处置',
      icon: <SafetyCertificateOutlined />,
      children: selectedDepartment && (
        <div>
          <Descriptions title="责任人信息" bordered column={1} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="责任人姓名">{selectedDepartment.leader}</Descriptions.Item>
            <Descriptions.Item label="职务">信息化建设负责人</Descriptions.Item>
            <Descriptions.Item label="联系方式">{selectedDepartment.phone}</Descriptions.Item>
            <Descriptions.Item label="所属部门">{selectedDepartment.name}</Descriptions.Item>
          </Descriptions>
          <Divider />
          <Title level={5}>处置记录</Title>
          <Timeline
            items={[
              {
                color: 'green',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>系统升级完成 <Tag color="green">已闭环</Tag></div>
                    <Text type="secondary">2026-06-16 09:00 - 处置人：王主任</Text>
                    <div>完成系统升级，所有接口恢复正常服务，平均响应时间恢复至120ms以内</div>
                  </div>
                )
              },
              {
                color: 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>网络故障排查 <Tag color="blue">处置中</Tag></div>
                    <Text type="secondary">2026-06-15 15:30 - 处置人：张局长</Text>
                    <div>已定位网络故障原因，正在协调运营商进行线路切换</div>
                  </div>
                )
              },
              {
                color: 'orange',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>安全漏洞修复 <Tag color="orange">待确认</Tag></div>
                    <Text type="secondary">2026-06-15 10:15 - 处置人：李厅长</Text>
                    <div>发现接口安全漏洞，已提交修复方案，等待确认后实施</div>
                  </div>
                )
              },
              {
                color: 'gray',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>数据同步异常处理 <Tag color="blue">处置中</Tag></div>
                    <Text type="secondary">2026-06-14 16:45 - 处置人：赵主任</Text>
                    <div>数据同步出现格式异常，正在与数据源单位协调解决</div>
                  </div>
                )
              },
              {
                color: 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>恢复验证中 <Tag color="blue">验证中</Tag></div>
                    <Text type="secondary">2026-06-16 11:00 - 验证人：王主任</Text>
                    <div>对连接超时恢复结果进行验证，确认服务可用性达标</div>
                  </div>
                )
              },
              {
                color: 'green',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>恢复复核完成 <Tag color="green">已通过</Tag></div>
                    <Text type="secondary">2026-06-16 12:00 - 复核人：张局长</Text>
                    <div>确认系统升级后所有异常已消除，恢复正式服务</div>
                  </div>
                )
              }
            ]}
          />
        </div>
      )
    },
    {
      key: 'review',
      label: '复核记录',
      icon: <AuditOutlined />,
      children: selectedDepartment && (
        <div>
          <Table
            columns={[
              { title: '复核时间', dataIndex: 'reviewTime', key: 'reviewTime', width: 160 },
              { title: '复核人', dataIndex: 'reviewer', key: 'reviewer' },
              { title: '复核类型', dataIndex: 'reviewType', key: 'reviewType', render: (t: string) => <Tag color="blue">{t}</Tag> },
              {
                title: '复核结果',
                dataIndex: 'result',
                key: 'result',
                render: (r: string) => {
                  const config: Record<string, { color: string; text: string }> = {
                    passed: { color: 'green', text: '通过' },
                    failed: { color: 'red', text: '未通过' },
                    conditional: { color: 'orange', text: '有条件通过' }
                  }
                  const item = config[r] || { color: 'default', text: r }
                  return <Tag color={item.color}>{item.text}</Tag>
                }
              },
              { title: '备注', dataIndex: 'remark', key: 'remark' }
            ]}
            dataSource={[
              { key: 'r1', reviewTime: '2026-06-16 10:30', reviewer: '安全审核组-刘工', reviewType: '接口安全复核', result: 'passed', remark: '接口安全策略符合规范要求' },
              { key: 'r2', reviewTime: '2026-06-15 14:00', reviewer: '数据审核组-陈工', reviewType: '数据合规复核', result: 'conditional', remark: '数据传输加密需升级至SM4国密标准' },
              { key: 'r3', reviewTime: '2026-06-14 09:30', reviewer: '权限审核组-周工', reviewType: '权限变更复核', result: 'passed', remark: '权限变更符合最小权限原则' },
              { key: 'r4', reviewTime: '2026-06-13 16:00', reviewer: '运维审核组-吴工', reviewType: '系统升级复核', result: 'failed', remark: '系统升级方案缺少回滚预案，需补充后重新提交' }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />
        </div>
      )
    },
    {
      key: 'recovery-review',
      label: '恢复复核',
      icon: <CheckCircleOutlined />,
      children: selectedDepartment && (
        <div>
          <Table
            columns={[
              { title: '复核时间', dataIndex: 'reviewTime', key: 'reviewTime', width: 160 },
              { title: '复核人', dataIndex: 'reviewer', key: 'reviewer' },
              { title: '原异常描述', dataIndex: 'errorDesc', key: 'errorDesc' },
              { title: '恢复方案', dataIndex: 'recoveryPlan', key: 'recoveryPlan' },
              {
                title: '复核结果',
                dataIndex: 'result',
                key: 'result',
                render: (r: string) => {
                  const config: Record<string, { color: string; text: string }> = {
                    confirmed: { color: 'green', text: '确认恢复' },
                    pending: { color: 'orange', text: '待验证' },
                    partial: { color: 'blue', text: '部分恢复' },
                    notRecovered: { color: 'red', text: '未恢复' }
                  }
                  const item = config[r] || { color: 'default', text: r }
                  return <Tag color={item.color}>{item.text}</Tag>
                }
              },
              { title: '恢复确认时间', dataIndex: 'confirmTime', key: 'confirmTime', width: 160 },
              {
                title: '操作',
                key: 'action',
                render: () => (
                  <Button type="link" size="small" onClick={() => {}}>
                    查看步骤
                  </Button>
                )
              }
            ]}
            expandable={{
              expandedRowRender: (record: any) => (
                <div style={{ padding: '8px 0' }}>
                  <Descriptions bordered column={1} size="small" title="恢复步骤详情">
                    <Descriptions.Item label="步骤一">{record.step1}</Descriptions.Item>
                    <Descriptions.Item label="步骤二">{record.step2}</Descriptions.Item>
                    <Descriptions.Item label="步骤三">{record.step3}</Descriptions.Item>
                  </Descriptions>
                </div>
              )
            }}
            dataSource={[
              {
                key: 'rr1',
                reviewTime: '2026-06-16 10:00',
                reviewer: '运维组-王工',
                errorDesc: '连接超时',
                recoveryPlan: '重启服务并优化连接池配置',
                result: 'confirmed',
                confirmTime: '2026-06-16 12:00',
                step1: '检测服务状态，确认超时原因',
                step2: '重启服务并调整连接池参数为200',
                step3: '验证服务可用性，确认响应时间达标'
              },
              {
                key: 'rr2',
                reviewTime: '2026-06-16 09:00',
                reviewer: '安全组-刘工',
                errorDesc: '证书过期',
                recoveryPlan: '更新SSL证书并重新部署',
                result: 'pending',
                confirmTime: '预计2026-06-17 09:00',
                step1: '申请新证书并完成CA签发',
                step2: '部署新证书到服务节点',
                step3: '验证证书链完整性（待执行）'
              },
              {
                key: 'rr3',
                reviewTime: '2026-06-15 16:00',
                reviewer: '数据组-陈工',
                errorDesc: '数据格式异常',
                recoveryPlan: '修复数据解析模块并补充校验规则',
                result: 'partial',
                confirmTime: '2026-06-16 10:30',
                step1: '定位数据格式异常字段',
                step2: '修复解析模块并增加容错处理',
                step3: '部分接口数据格式仍有偏差，继续排查'
              },
              {
                key: 'rr4',
                reviewTime: '2026-06-15 11:00',
                reviewer: '权限组-周工',
                errorDesc: '权限拒绝',
                recoveryPlan: '重新配置接口访问权限',
                result: 'notRecovered',
                confirmTime: '-',
                step1: '审查当前权限配置',
                step2: '提交权限变更申请（审批中）',
                step3: '等待审批通过后重新配置'
              }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />
        </div>
      )
    },
    {
      key: 'cross-dept-sync',
      label: '跨部门同步',
      icon: <BranchesOutlined />,
      children: selectedDepartment && (
        <div>
          <Table
            columns={[
              { title: '对接部门', dataIndex: 'dept', key: 'dept' },
              { title: '同步数据类型', dataIndex: 'dataType', key: 'dataType' },
              { title: '同步方式', dataIndex: 'syncMode', key: 'syncMode', render: (m: string) => <Tag color={m === '实时同步' ? 'blue' : 'default'}>{m}</Tag> },
              { title: '同步频率', dataIndex: 'frequency', key: 'frequency' },
              { title: '最近同步时间', dataIndex: 'lastSyncTime', key: 'lastSyncTime', width: 160 },
              {
                title: '同步状态',
                dataIndex: 'status',
                key: 'status',
                render: (s: string) => {
                  const config: Record<string, { color: string; text: string }> = {
                    normal: { color: 'green', text: '同步正常' },
                    error: { color: 'red', text: '异常' },
                    delayed: { color: 'orange', text: '延迟' }
                  }
                  const item = config[s] || { color: 'default', text: s }
                  return <Tag color={item.color}>{item.text}</Tag>
                }
              }
            ]}
            expandable={{
              rowExpandable: (record: any) => record.status !== 'normal',
              expandedRowRender: (record: any) => (
                <div style={{ padding: '8px 0' }}>
                  <Descriptions bordered column={1} size="small" title="异常详情">
                    <Descriptions.Item label="异常原因">{record.errorReason}</Descriptions.Item>
                    <Descriptions.Item label="影响数据量">{record.affectedData}</Descriptions.Item>
                    <Descriptions.Item label="处置措施">{record.measure}</Descriptions.Item>
                    <Descriptions.Item label="预计恢复时间">{record.estimatedRecovery}</Descriptions.Item>
                  </Descriptions>
                </div>
              )
            }}
            dataSource={[
              {
                key: 'cds1',
                dept: '公安厅 ↔ 本厅',
                dataType: '人口基础信息',
                syncMode: '实时同步',
                frequency: '每日',
                lastSyncTime: '2026-06-16 08:00',
                status: 'normal'
              },
              {
                key: 'cds2',
                dept: '人社厅 ↔ 本厅',
                dataType: '社保参保信息',
                syncMode: '批量同步',
                frequency: '每周',
                lastSyncTime: '2026-06-15 22:00',
                status: 'normal'
              },
              {
                key: 'cds3',
                dept: '医保局 ↔ 本厅',
                dataType: '医保结算数据',
                syncMode: '实时同步',
                frequency: '每日',
                lastSyncTime: '2026-06-16 07:30',
                status: 'error',
                errorReason: '数据格式不匹配，字段类型变更未同步更新',
                affectedData: '3条结算记录',
                measure: '已通知医保局数据部门，正在协调更新数据映射规则',
                estimatedRecovery: '2026-06-17 10:00'
              },
              {
                key: 'cds4',
                dept: '住建厅 ↔ 本厅',
                dataType: '不动产登记信息',
                syncMode: '批量同步',
                frequency: '每月',
                lastSyncTime: '2024-01-10 23:00',
                status: 'normal'
              },
              {
                key: 'cds5',
                dept: '民政厅 ↔ 本厅',
                dataType: '婚姻登记信息',
                syncMode: '批量同步',
                frequency: '每周',
                lastSyncTime: '2026-06-14 22:00',
                status: 'delayed',
                errorReason: '源系统批量导出任务排队，导致数据延迟推送',
                affectedData: '约200条登记记录',
                measure: '已协调民政厅优化导出任务调度，增加并发通道',
                estimatedRecovery: '2026-06-16 14:00'
              }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text strong>跨部门同步总体健康度</Text>
            <Progress percent={85} style={{ flex: 1 }} />
          </div>
        </div>
      )
    },
    {
      key: 'responsibility-boundary',
      label: '接口责任边界',
      icon: <SafetyOutlined />,
      children: selectedDepartment && (
        <div>
          <Descriptions title="接口责任人信息" bordered column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="接口总负责人">{selectedDepartment.leader}</Descriptions.Item>
            <Descriptions.Item label="技术对接人">李工程师（分机：8001）</Descriptions.Item>
            <Descriptions.Item label="业务对接人">王专员（分机：8002）</Descriptions.Item>
            <Descriptions.Item label="运维值班人">张运维（7x24值班电话：138****0001）</Descriptions.Item>
            <Descriptions.Item label="安全责任人">刘安全（安全专线：0951-****110）</Descriptions.Item>
            <Descriptions.Item label="应急联系人">赵应急（应急电话：139****0002）</Descriptions.Item>
          </Descriptions>
          <Divider />
          <Title level={5}>接口责任矩阵表</Title>
          <Table
            columns={[
              { title: '接口名称', dataIndex: 'name', key: 'name' },
              { title: '责任部门', dataIndex: 'dept', key: 'dept' },
              { title: '责任人', dataIndex: 'owner', key: 'owner' },
              { title: 'SLA响应时间', dataIndex: 'sla', key: 'sla' },
              { title: '升级路径', dataIndex: 'path', key: 'path' },
              { title: '升级时限', dataIndex: 'limit', key: 'limit' }
            ]}
            dataSource={[
              { key: 'rb1', name: '基础信息查询', dept: selectedDepartment.name, owner: '李工程师', sla: '5分钟', path: '一线→二线→三线→总监→分管厅长', limit: '15分钟' },
              { key: 'rb2', name: '业务办理提交', dept: selectedDepartment.name, owner: '王专员', sla: '10分钟', path: '一线→二线→三线→总监→分管厅长', limit: '30分钟' },
              { key: 'rb3', name: '数据同步上报', dept: selectedDepartment.name, owner: '张运维', sla: '15分钟', path: '一线→二线→三线→总监→分管厅长', limit: '1小时' },
              { key: 'rb4', name: '证照共享调用', dept: selectedDepartment.name, owner: '刘安全', sla: '30分钟', path: '一线→二线→三线→总监→分管厅长', limit: '2小时' },
              { key: 'rb5', name: '统计报表导出', dept: selectedDepartment.name, owner: '赵应急', sla: '30分钟', path: '一线→二线→三线→总监→分管厅长', limit: '2小时' }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />
        </div>
      )
    },
    {
      key: 'exception-summary',
      label: '异常处理汇总',
      icon: <WarningOutlined />,
      children: selectedDepartment && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="本月异常总数"
                  value={128}
                  suffix="次"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已恢复"
                  value={112}
                  suffix="次（87.5%）"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="处理中"
                  value={12}
                  suffix="次"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="MTTR平均恢复时间"
                  value={28}
                  suffix="分钟"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
          <Divider />
          <Title level={5}>异常类型分布</Title>
          <Table
            style={{ marginBottom: 24 }}
            columns={[
              { title: '异常类型', dataIndex: 'type', key: 'type' },
              { title: '发生次数', dataIndex: 'count', key: 'count' },
              { title: '占比', dataIndex: 'ratio', key: 'ratio' },
              { title: '平均恢复时长', dataIndex: 'avgTime', key: 'avgTime' },
              { title: '改进措施', dataIndex: 'measure', key: 'measure' }
            ]}
            dataSource={[
              { key: 'et1', type: '连接超时', count: 34, ratio: '26.6%', avgTime: '35分钟', measure: '增加连接池' },
              { key: 'et2', type: '证书过期', count: 24, ratio: '18.8%', avgTime: '45分钟', measure: '证书自动续期脚本' },
              { key: 'et3', type: '权限拒绝', count: 20, ratio: '15.6%', avgTime: '20分钟', measure: '权限审计' },
              { key: 'et4', type: '数据格式', count: 26, ratio: '20.3%', avgTime: '22分钟', measure: '数据校验规则优化' },
              { key: 'et5', type: '响应超时', count: 24, ratio: '18.7%', avgTime: '18分钟', measure: '接口性能优化' }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />
          <Divider />
          <Title level={5}>TOP10异常接口</Title>
          <div>
            {[
              { name: '基础信息查询', count: 32, lastTime: '2026-06-15 14:28:15', status: 'recovered' },
              { name: '业务办理提交', count: 28, lastTime: '2026-06-15 11:15:33', status: 'processing' },
              { name: '数据同步上报', count: 22, lastTime: '2026-06-14 22:45:18', status: 'recovered' },
              { name: '证照共享调用', count: 18, lastTime: '2026-06-14 18:20:05', status: 'recovered' },
              { name: '统计报表导出', count: 15, lastTime: '2026-06-14 10:10:42', status: 'processing' }
            ].map((item, idx) => {
              const statusConfig: Record<string, { color: string; text: string }> = {
                recovered: { color: 'green', text: '已恢复' },
                processing: { color: 'orange', text: '处理中' }
              }
              const sc = statusConfig[item.status] || { color: 'default', text: item.status }
              return (
                <Card key={idx} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Space>
                        <Badge count={idx + 1} style={{ backgroundColor: idx < 3 ? '#ff4d4f' : '#faad14' }} />
                        <Text strong>{item.name}</Text>
                        <Tag color="red">发生{item.count}次</Tag>
                      </Space>
                    </div>
                    <Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>最后发生：{item.lastTime}</Text>
                      <Tag color={sc.color}>{sc.text}</Tag>
                    </Space>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )
    },
    {
      key: 'compliance-check',
      label: '等保国密验收',
      icon: <AuditOutlined />,
      children: selectedDepartment && (
        <div>
          <Title level={5}>等保三级合规检查清单</Title>
          <Table
            style={{ marginBottom: 24 }}
            columns={[
              { title: '检查项', dataIndex: 'item', key: 'item' },
              {
                title: '检查结果',
                dataIndex: 'result',
                key: 'result',
                render: (r: string) => {
                  const config: Record<string, { color: string; text: string }> = {
                    passed: { color: 'green', text: '通过' },
                    conditional: { color: 'orange', text: '有条件通过' },
                    failed: { color: 'red', text: '未通过' }
                  }
                  const item = config[r] || { color: 'default', text: r }
                  return <Tag color={item.color}>{item.text}</Tag>
                }
              },
              { title: '检查时间', dataIndex: 'time', key: 'time', width: 160 },
              { title: '检查人', dataIndex: 'inspector', key: 'inspector' },
              { title: '备注', dataIndex: 'remark', key: 'remark' }
            ]}
            dataSource={[
              { key: 'cc1', item: '物理安全-机房环境监控', result: 'passed', time: '2026-06-10 09:30', inspector: '等保测评中心-马工', remark: '温湿度、门禁、视频监控均符合要求' },
              { key: 'cc2', item: '物理安全-防火防水设施', result: 'passed', time: '2026-06-10 10:15', inspector: '等保测评中心-马工', remark: '消防系统、防水检测设备正常' },
              { key: 'cc3', item: '网络安全-边界访问控制', result: 'passed', time: '2026-06-10 14:00', inspector: '等保测评中心-杨工', remark: '防火墙策略配置合规' },
              { key: 'cc4', item: '网络安全-入侵检测防范', result: 'passed', time: '2026-06-10 15:30', inspector: '等保测评中心-杨工', remark: 'IDS/IPS规则库已更新至最新版本' },
              { key: 'cc5', item: '主机安全-身份鉴别机制', result: 'passed', time: '2026-06-11 09:00', inspector: '等保测评中心-王工', remark: '双因素认证已全面部署' },
              { key: 'cc6', item: '主机安全-恶意代码防范', result: 'passed', time: '2026-06-11 10:30', inspector: '等保测评中心-王工', remark: '防病毒软件病毒库已更新' },
              { key: 'cc7', item: '应用安全-身份鉴别', result: 'passed', time: '2026-06-11 14:00', inspector: '等保测评中心-李工', remark: '密码复杂度、登录失败处理均符合要求' },
              { key: 'cc8', item: '应用安全-访问控制', result: 'passed', time: '2026-06-11 15:30', inspector: '等保测评中心-李工', remark: '最小权限原则落实到位' },
              { key: 'cc9', item: '应用安全-通信完整性保密性', result: 'conditional', time: '2026-06-12 09:30', inspector: '等保测评中心-李工', remark: '数据备份恢复演练频率需提升至每月' },
              { key: 'cc10', item: '数据安全-数据保密性', result: 'passed', time: '2026-06-12 11:00', inspector: '等保测评中心-张工', remark: '敏感数据加密存储符合要求' },
              { key: 'cc11', item: '数据安全-数据完整性', result: 'passed', time: '2026-06-12 14:00', inspector: '等保测评中心-张工', remark: '数据校验机制完善' },
              { key: 'cc12', item: '数据安全-备份恢复', result: 'conditional', time: '2026-06-12 15:30', inspector: '等保测评中心-张工', remark: '异地备份网络带宽需优化，建议升级至1Gbps' }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />
          <Divider />
          <Title level={5}>国密算法传输验收</Title>
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="SM4传输加密">已启用，AES-256兼容</Descriptions.Item>
            <Descriptions.Item label="SM3签名验签">全量接口强制开启</Descriptions.Item>
            <Descriptions.Item label="SM2身份认证">管理员接口必选，普通用户可选</Descriptions.Item>
            <Descriptions.Item label="SM9邮件加密">已部署，待推广</Descriptions.Item>
            <Descriptions.Item label="SSL证书国密化">双证书（SM2+RSA）已部署</Descriptions.Item>
            <Descriptions.Item label="国密改造完成度">
              <Progress percent={92} status="active" />
            </Descriptions.Item>
          </Descriptions>
          <Divider />
          <Title level={5}>验收结论</Title>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Space wrap>
                  <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>验收通过</Tag>
                  <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>等保三级</Tag>
                  <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>国密SMx全栈</Tag>
                </Space>
              </div>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="验收有效期">2026-01-15 至 2027-01-14</Descriptions.Item>
                <Descriptions.Item label="下次复测时间">2026-12-15</Descriptions.Item>
                <Descriptions.Item label="验收机构">宁夏自治区等保测评中心 + 国密应用试点认证联合工作组</Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </div>
      )
    },
    {
      key: 'service-bearing',
      label: '事项承载',
      icon: <AppstoreOutlined />,
      children: selectedDepartment && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic title="承载事项总数" value={28} suffix="件" valueStyle={{ color: '#0958d9' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="即时办结事项" value={12} suffix="件" valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="承诺办结事项" value={16} suffix="件" valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="本月办件量" value={3856} precision={0} suffix="件" valueStyle={{ color: '#722ed1' }} />
              </Card>
            </Col>
          </Row>

          <Title level={5}>事项承载清单</Title>
          <Table
            style={{ marginBottom: 24 }}
            columns={[
              { title: '事项编码', dataIndex: 'code', key: 'code', width: 130 },
              { title: '事项名称', dataIndex: 'name', key: 'name' },
              { title: '事项类型', dataIndex: 'type', key: 'type', render: (t: string) => {
                const colors: Record<string, string> = { '行政许可': 'blue', '行政确认': 'green', '行政给付': 'orange', '公共服务': 'purple' }
                return <Tag color={colors[t] || 'default'}>{t}</Tag>
              }},
              { title: '办理层级', dataIndex: 'level', key: 'level' },
              { title: '承诺时限', dataIndex: 'timeLimit', key: 'timeLimit', width: 90 },
              { title: '承载接口数', dataIndex: 'interfaceCount', key: 'interfaceCount', width: 90 },
              { title: '办件量', dataIndex: 'volume', key: 'volume', width: 80 },
              { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === '运行中' ? 'green' : 'orange'}>{s}</Tag> }
            ]}
            dataSource={(
              selectedDepartment.category === 'gong-an' ? [
                { key: 'sb1', code: 'NX-GA-XK-001', name: '户籍办理', type: '行政确认', level: '省级/市级/县级', timeLimit: '1个工作日', interfaceCount: 4, volume: 1286, status: '运行中' },
                { key: 'sb2', code: 'NX-GA-XK-002', name: '身份证办理', type: '行政确认', level: '省级/市级/县级', timeLimit: '15个工作日', interfaceCount: 3, volume: 856, status: '运行中' },
                { key: 'sb3', code: 'NX-GA-XK-003', name: '出入境证件办理', type: '行政许可', level: '省级/市级', timeLimit: '7个工作日', interfaceCount: 5, volume: 428, status: '运行中' },
                { key: 'sb4', code: 'NX-GA-XK-004', name: '驾驶证办理', type: '行政许可', level: '市级/县级', timeLimit: '3个工作日', interfaceCount: 4, volume: 612, status: '调整中' },
                { key: 'sb5', code: 'NX-GA-XK-005', name: '机动车登记', type: '行政确认', level: '市级/县级', timeLimit: '1个工作日', interfaceCount: 3, volume: 389, status: '运行中' },
                { key: 'sb6', code: 'NX-GA-FW-006', name: '违章查询处理', type: '公共服务', level: '省级/市级/县级', timeLimit: '即时办结', interfaceCount: 2, volume: 2156, status: '运行中' },
                { key: 'sb7', code: 'NX-GA-XK-007', name: '居住证办理', type: '行政确认', level: '市级/县级', timeLimit: '15个工作日', interfaceCount: 3, volume: 234, status: '运行中' },
                { key: 'sb8', code: 'NX-GA-XK-008', name: '特种行业许可证', type: '行政许可', level: '市级/县级', timeLimit: '10个工作日', interfaceCount: 4, volume: 78, status: '调整中' }
              ] : selectedDepartment.category === 'ren-she' ? [
                { key: 'sb1', code: 'NX-RS-XK-001', name: '社保查询', type: '公共服务', level: '省级/市级/县级', timeLimit: '即时办结', interfaceCount: 3, volume: 3256, status: '运行中' },
                { key: 'sb2', code: 'NX-RS-XK-002', name: '养老金申领', type: '行政给付', level: '省级/市级/县级', timeLimit: '10个工作日', interfaceCount: 4, volume: 567, status: '运行中' },
                { key: 'sb3', code: 'NX-RS-XK-003', name: '失业保险金申领', type: '行政给付', level: '市级/县级', timeLimit: '5个工作日', interfaceCount: 3, volume: 234, status: '运行中' },
                { key: 'sb4', code: 'NX-RS-XK-004', name: '工伤认定', type: '行政确认', level: '市级', timeLimit: '60个工作日', interfaceCount: 5, volume: 128, status: '运行中' },
                { key: 'sb5', code: 'NX-RS-XK-005', name: '社保卡办理', type: '公共服务', level: '省级/市级/县级', timeLimit: '30个工作日', interfaceCount: 3, volume: 892, status: '调整中' },
                { key: 'sb6', code: 'NX-RS-XK-006', name: '就业登记', type: '行政确认', level: '市级/县级', timeLimit: '即时办结', interfaceCount: 2, volume: 1456, status: '运行中' },
                { key: 'sb7', code: 'NX-RS-XK-007', name: '技能等级认定', type: '行政确认', level: '市级', timeLimit: '20个工作日', interfaceCount: 4, volume: 167, status: '运行中' },
                { key: 'sb8', code: 'NX-RS-XK-008', name: '劳动仲裁申请', type: '公共服务', level: '市级/县级', timeLimit: '45个工作日', interfaceCount: 3, volume: 89, status: '运行中' }
              ] : selectedDepartment.category === 'wei-jian' ? [
                { key: 'sb1', code: 'NX-WJ-XK-001', name: '医保报销', type: '行政给付', level: '省级/市级/县级', timeLimit: '15个工作日', interfaceCount: 5, volume: 2156, status: '运行中' },
                { key: 'sb2', code: 'NX-WJ-XK-002', name: '异地就医备案', type: '公共服务', level: '省级/市级/县级', timeLimit: '即时办结', interfaceCount: 3, volume: 1823, status: '运行中' },
                { key: 'sb3', code: 'NX-WJ-XK-003', name: '医保参保登记', type: '行政确认', level: '市级/县级', timeLimit: '5个工作日', interfaceCount: 4, volume: 967, status: '运行中' },
                { key: 'sb4', code: 'NX-WJ-XK-004', name: '门诊慢特病认定', type: '行政确认', level: '市级', timeLimit: '10个工作日', interfaceCount: 4, volume: 345, status: '调整中' },
                { key: 'sb5', code: 'NX-WJ-XK-005', name: '生育津贴申领', type: '行政给付', level: '市级/县级', timeLimit: '15个工作日', interfaceCount: 3, volume: 234, status: '运行中' },
                { key: 'sb6', code: 'NX-WJ-XK-006', name: '医疗机构执业许可', type: '行政许可', level: '市级', timeLimit: '30个工作日', interfaceCount: 5, volume: 56, status: '运行中' },
                { key: 'sb7', code: 'NX-WJ-XK-007', name: '医师执业注册', type: '行政许可', level: '市级', timeLimit: '10个工作日', interfaceCount: 3, volume: 178, status: '运行中' },
                { key: 'sb8', code: 'NX-WJ-XK-008', name: '疫苗接种预约', type: '公共服务', level: '市级/县级', timeLimit: '即时办结', interfaceCount: 2, volume: 3421, status: '运行中' }
              ] : selectedDepartment.category === 'zhu-jian' ? [
                { key: 'sb1', code: 'NX-ZJ-XK-001', name: '不动产登记', type: '行政确认', level: '市级/县级', timeLimit: '5个工作日', interfaceCount: 5, volume: 1256, status: '运行中' },
                { key: 'sb2', code: 'NX-ZJ-XK-002', name: '公积金提取', type: '行政给付', level: '市级/县级', timeLimit: '3个工作日', interfaceCount: 4, volume: 2341, status: '运行中' },
                { key: 'sb3', code: 'NX-ZJ-XK-003', name: '建设工程规划许可', type: '行政许可', level: '市级/县级', timeLimit: '20个工作日', interfaceCount: 5, volume: 178, status: '运行中' },
                { key: 'sb4', code: 'NX-ZJ-XK-004', name: '施工许可证办理', type: '行政许可', level: '市级/县级', timeLimit: '15个工作日', interfaceCount: 4, volume: 145, status: '调整中' },
                { key: 'sb5', code: 'NX-ZJ-XK-005', name: '商品房预售许可', type: '行政许可', level: '市级', timeLimit: '10个工作日', interfaceCount: 4, volume: 67, status: '运行中' },
                { key: 'sb6', code: 'NX-ZJ-XK-006', name: '公积金贷款申请', type: '公共服务', level: '市级/县级', timeLimit: '15个工作日', interfaceCount: 5, volume: 456, status: '运行中' },
                { key: 'sb7', code: 'NX-ZJ-XK-007', name: '物业服务企业资质', type: '行政许可', level: '市级', timeLimit: '10个工作日', interfaceCount: 3, volume: 34, status: '运行中' },
                { key: 'sb8', code: 'NX-ZJ-XK-008', name: '危房鉴定申请', type: '公共服务', level: '市级/县级', timeLimit: '15个工作日', interfaceCount: 3, volume: 89, status: '运行中' }
              ] : selectedDepartment.category === 'min-zheng' ? [
                { key: 'sb1', code: 'NX-MZ-XK-001', name: '婚姻登记', type: '行政确认', level: '县级', timeLimit: '即时办结', interfaceCount: 3, volume: 1567, status: '运行中' },
                { key: 'sb2', code: 'NX-MZ-XK-002', name: '低保申请', type: '行政给付', level: '县级', timeLimit: '30个工作日', interfaceCount: 4, volume: 678, status: '运行中' },
                { key: 'sb3', code: 'NX-MZ-XK-003', name: '社会组织登记', type: '行政许可', level: '市级/县级', timeLimit: '30个工作日', interfaceCount: 4, volume: 89, status: '运行中' },
                { key: 'sb4', code: 'NX-MZ-XK-004', name: '收养登记', type: '行政确认', level: '市级/县级', timeLimit: '30个工作日', interfaceCount: 4, volume: 56, status: '调整中' },
                { key: 'sb5', code: 'NX-MZ-XK-005', name: '特困人员救助', type: '行政给付', level: '县级', timeLimit: '15个工作日', interfaceCount: 3, volume: 234, status: '运行中' },
                { key: 'sb6', code: 'NX-MZ-XK-006', name: '临时救助申请', type: '行政给付', level: '县级', timeLimit: '10个工作日', interfaceCount: 3, volume: 456, status: '运行中' },
                { key: 'sb7', code: 'NX-MZ-XK-007', name: '退役军人优待证', type: '行政确认', level: '县级', timeLimit: '20个工作日', interfaceCount: 4, volume: 789, status: '运行中' },
                { key: 'sb8', code: 'NX-MZ-XK-008', name: '养老机构设立许可', type: '行政许可', level: '市级/县级', timeLimit: '20个工作日', interfaceCount: 5, volume: 23, status: '运行中' }
              ] : [
                { key: 'sb1', code: 'NX-QT-XK-001', name: '企业设立登记', type: '行政许可', level: '市级/县级', timeLimit: '1个工作日', interfaceCount: 4, volume: 2341, status: '运行中' },
                { key: 'sb2', code: 'NX-QT-XK-002', name: '个体工商户登记', type: '行政确认', level: '县级', timeLimit: '即时办结', interfaceCount: 3, volume: 3456, status: '运行中' },
                { key: 'sb3', code: 'NX-QT-XK-003', name: '食品经营许可', type: '行政许可', level: '县级', timeLimit: '15个工作日', interfaceCount: 5, volume: 567, status: '运行中' },
                { key: 'sb4', code: 'NX-QT-XK-004', name: '道路运输经营许可', type: '行政许可', level: '市级/县级', timeLimit: '20个工作日', interfaceCount: 4, volume: 234, status: '调整中' },
                { key: 'sb5', code: 'NX-QT-XK-005', name: '教师资格认定', type: '行政许可', level: '市级', timeLimit: '30个工作日', interfaceCount: 4, volume: 456, status: '运行中' },
                { key: 'sb6', code: 'NX-QT-XK-006', name: '税务登记变更', type: '公共服务', level: '市级/县级', timeLimit: '即时办结', interfaceCount: 2, volume: 4521, status: '运行中' },
                { key: 'sb7', code: 'NX-QT-XK-007', name: '土地使用权登记', type: '行政确认', level: '市级/县级', timeLimit: '10个工作日', interfaceCount: 5, volume: 345, status: '运行中' },
                { key: 'sb8', code: 'NX-QT-XK-008', name: '林木采伐许可', type: '行政许可', level: '县级', timeLimit: '20个工作日', interfaceCount: 4, volume: 67, status: '运行中' }
              ]
            )}
            rowKey="key"
            size="small"
            pagination={false}
          />

          <Alert
            type="info"
            showIcon
            message="接口-事项-异常处置串联说明"
            description="每个事项平均绑定3.2个接口，接口异常自动关联事项办件告警，5分钟内触发异常处置流程"
          />
        </div>
      )
    },
    {
      key: 'business-chain',
      label: '业务链路',
      icon: <BranchesOutlined />,
      children: selectedDepartment && (
        <div>
          <Title level={5}>接口-事项-异常全景图</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card size="small" title="业务办理链路">
                <Timeline
                  items={[
                    { color: 'green', children: <div><Text strong>接口调用</Text><div><Tag color="green">正常</Tag><Text type="secondary" style={{ marginLeft: 8 }}>12,458次/日</Text></div></div> },
                    { color: 'green', children: <div><Text strong>事项办理</Text><div><Tag color="green">正常</Tag><Text type="secondary" style={{ marginLeft: 8 }}>3,856件/月</Text></div></div> },
                    { color: 'blue', children: <div><Text strong>办件结果</Text><div><Tag color="blue">处理中</Tag><Text type="secondary" style={{ marginLeft: 8 }}>成功率98.7%</Text></div></div> },
                    { color: 'green', children: <div><Text strong>证照生成</Text><div><Tag color="green">正常</Tag><Text type="secondary" style={{ marginLeft: 8 }}>3,245份/月</Text></div></div> }
                  ]}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="数据共享链路">
                <Timeline
                  items={[
                    { color: 'green', children: <div><Text strong>数据同步</Text><div><Tag color="green">正常</Tag><Text type="secondary" style={{ marginLeft: 8 }}>568批次/日</Text></div></div> },
                    { color: 'green', children: <div><Text strong>跨部门共享</Text><div><Tag color="green">正常</Tag><Text type="secondary" style={{ marginLeft: 8 }}>12个部门</Text></div></div> },
                    { color: 'orange', children: <div><Text strong>数据授权</Text><div><Tag color="orange">调整中</Tag><Text type="secondary" style={{ marginLeft: 8 }}>3项待审批</Text></div></div> },
                    { color: 'green', children: <div><Text strong>安全审计</Text><div><Tag color="green">正常</Tag><Text type="secondary" style={{ marginLeft: 8 }}>100%覆盖</Text></div></div> }
                  ]}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="异常处置链路">
                <Timeline
                  items={[
                    { color: 'orange', children: <div><Text strong>异常触发</Text><div><Tag color="orange">告警</Tag><Text type="secondary" style={{ marginLeft: 8 }}>12次/本月</Text></div></div> },
                    { color: 'green', children: <div><Text strong>告警通知</Text><div><Tag color="green">正常</Tag><Text type="secondary" style={{ marginLeft: 8 }}>≤1分钟</Text></div></div> },
                    { color: 'blue', children: <div><Text strong>责任处置</Text><div><Tag color="blue">处理中</Tag><Text type="secondary" style={{ marginLeft: 8 }}>3项进行中</Text></div></div> },
                    { color: 'green', children: <div><Text strong>恢复复核</Text><div><Tag color="green">正常</Tag><Text type="secondary" style={{ marginLeft: 8 }}>闭环率97.6%</Text></div></div> }
                  ]}
                />
              </Card>
            </Col>
          </Row>

          <Title level={5}>核心系统接口健康度</Title>
          <Table
            style={{ marginBottom: 24 }}
            columns={[
              { title: '接口名称', dataIndex: 'name', key: 'name' },
              { title: '关联事项数', dataIndex: 'itemCount', key: 'itemCount', width: 90 },
              { title: '今日调用量', dataIndex: 'calls', key: 'calls' },
              { title: '成功率', dataIndex: 'successRate', key: 'successRate' },
              { title: '平均响应', dataIndex: 'avgResp', key: 'avgResp', width: 90 },
              { title: '异常次数', dataIndex: 'errorCount', key: 'errorCount', width: 90 },
              { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
                const colors: Record<string, string> = { '正常': 'green', '告警': 'orange', '异常': 'red' }
                return <Tag color={colors[s] || 'default'}>{s}</Tag>
              }}
            ]}
            dataSource={[
              { key: 'bc1', name: '基础信息查询接口', itemCount: 12, calls: '5,682', successRate: '99.8%', avgResp: '68ms', errorCount: 2, status: '正常' },
              { key: 'bc2', name: '业务办理提交接口', itemCount: 8, calls: '3,245', successRate: '98.5%', avgResp: '156ms', errorCount: 6, status: '告警' },
              { key: 'bc3', name: '数据同步上报接口', itemCount: 6, calls: '1,856', successRate: '99.2%', avgResp: '89ms', errorCount: 3, status: '正常' },
              { key: 'bc4', name: '证照生成调用接口', itemCount: 4, calls: '892', successRate: '95.3%', avgResp: '423ms', errorCount: 12, status: '异常' },
              { key: 'bc5', name: '统计报表导出接口', itemCount: 3, calls: '456', successRate: '99.5%', avgResp: '234ms', errorCount: 1, status: '正常' },
              { key: 'bc6', name: '身份认证核验接口', itemCount: 5, calls: '2,134', successRate: '97.8%', avgResp: '178ms', errorCount: 8, status: '告警' }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />

          <Title level={5}>异常处置联动机制</Title>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="异常发现时间">≤30秒</Descriptions.Item>
            <Descriptions.Item label="告警通知时间">≤1分钟</Descriptions.Item>
            <Descriptions.Item label="责任到人时间">≤5分钟</Descriptions.Item>
            <Descriptions.Item label="MTTR平均恢复">≤30分钟</Descriptions.Item>
            <Descriptions.Item label="异常处置闭环率">97.6%</Descriptions.Item>
            <Descriptions.Item label="异常关联事项通知">已启用（办事人可收到进度提醒）</Descriptions.Item>
          </Descriptions>
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        委办局管理
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card>
            <Statistic
              title="已接入委办局"
              value={statistics.onlineCount}
              suffix={`/ ${statistics.total}`}
              prefix={<AppstoreOutlined style={{ color: '#0958d9' }} />}
              valueStyle={{ color: '#0958d9' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="在线率"
              value={statistics.onlineRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="今日总调用量"
              value={statistics.totalTodayCalls}
              precision={0}
              prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="平均成功率"
              value={statistics.avgSuccessRate}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="未接入单位"
              value={statistics.total - statistics.onlineCount}
              suffix="个"
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {!isAdminOrManager && (
        <Alert
          message="只读视图"
          description="当前为普通用户权限，仅可查看委办局公开接入信息。详情查看、接口测试、数据同步等操作需管理员权限。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col span={5}>
          <Card
            title="委办局分类"
            size="small"
            style={{ height: 'calc(100vh - 280px)', overflow: 'auto' }}
          >
            <Tree
              showLine={{ showLeafIcon: false }}
              treeData={treeData}
              selectedKeys={selectedKeys}
              onSelect={handleTreeSelect}
              defaultExpandAll
              blockNode
            />
          </Card>
        </Col>

        <Col span={19}>
          <Alert
            message="未接入单位提醒"
            description={
              <div>
                <p style={{ marginBottom: 12 }}>以下3个委办局当前未接入平台，请及时跟进：</p>

                <div style={{ marginBottom: 12 }}>
                  <Space style={{ marginBottom: 8 }} wrap>
                    <Text strong style={{ fontSize: 14 }}>宁夏回族自治区中医药管理局</Text>
                    <Tag color="error">离线</Tag>
                    <Tag color="orange">待复核</Tag>
                    <Tag color="orange">恢复中</Tag>
                  </Space>
                  <Descriptions column={1} size="small" bordered style={{ marginBottom: 8 }}>
                    <Descriptions.Item label="原因说明">网络连接中断，运营商光缆故障导致专线中断</Descriptions.Item>
                    <Descriptions.Item label="责任单位">信息中心运维组</Descriptions.Item>
                    <Descriptions.Item label="责任人">王组长：138****0001</Descriptions.Item>
                  </Descriptions>
                  <Timeline
                    items={[
                      { color: 'green', children: <Space><Text>问题发现</Text><Tag color="green" style={{ fontSize: 11 }}>已完成</Tag><Text type="secondary" style={{ fontSize: 11 }}>2026-06-15 08:30</Text></Space> },
                      { color: 'orange', children: <Space><Text>紧急处置</Text><Tag color="orange" style={{ fontSize: 11 }}>处理中</Tag><Text type="secondary" style={{ fontSize: 11 }}>进行中</Text></Space> },
                      { color: 'blue', children: <Space><Text>系统恢复</Text><Tag color="blue" style={{ fontSize: 11 }}>待处理</Tag><Text type="secondary" style={{ fontSize: 11 }}>预计2026-06-17 10:00</Text></Space> },
                      { color: 'blue', children: <Space><Text>复核</Text><Tag color="blue" style={{ fontSize: 11 }}>待处理</Tag></Space> },
                      { color: 'gray', children: <Space><Text>重新纳管</Text><Tag color="default" style={{ fontSize: 11 }}>待启动</Tag></Space> }
                    ]}
                  />
                  <Row gutter={8} style={{ marginTop: 12, marginBottom: 8 }}>
                    <Col span={12}>
                      <Card size="small" title="恢复结果">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Tag color="orange" style={{ width: 'fit-content' }}>恢复中</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>运营商已修复光缆，正在进行业务连通性测试</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="复核结论">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Tag color="blue" style={{ width: 'fit-content' }}>待复核</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>预计恢复后24小时内完成复核</Text>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                  <Card size="small" title="重新纳管业务状态">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>业务接口恢复进度</Text>
                            <Progress percent={35} size="small" />
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>数据同步状态：</Text>
                            <Tag color="green">待同步</Tag>
                          </div>
                        </Space>
                      </Col>
                      <Col span={12}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="预计重新纳管时间">2026-06-18 12:00</Descriptions.Item>
                          <Descriptions.Item label="纳管责任人">王组长 138****0001</Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ marginBottom: 12 }}>
                  <Space style={{ marginBottom: 8 }} wrap>
                    <Text strong style={{ fontSize: 14 }}>宁夏回族自治区应急管理厅</Text>
                    <Tag color="error">离线</Tag>
                    <Tag color="blue">复核中</Tag>
                    <Tag color="red">未恢复</Tag>
                  </Space>
                  <Descriptions column={1} size="small" bordered style={{ marginBottom: 8 }}>
                    <Descriptions.Item label="原因说明">服务器硬件故障，主板损坏正在更换备件</Descriptions.Item>
                    <Descriptions.Item label="责任单位">信息中心服务器组</Descriptions.Item>
                    <Descriptions.Item label="责任人">李组长：138****0002</Descriptions.Item>
                  </Descriptions>
                  <Timeline
                    items={[
                      { color: 'green', children: <Space><Text>问题发现</Text><Tag color="green" style={{ fontSize: 11 }}>已完成</Tag><Text type="secondary" style={{ fontSize: 11 }}>2026-06-14 22:15</Text></Space> },
                      { color: 'orange', children: <Space><Text>紧急处置</Text><Tag color="orange" style={{ fontSize: 11 }}>处理中</Tag><Text type="secondary" style={{ fontSize: 11 }}>备件更换中</Text></Space> },
                      { color: 'red', children: <Space><Text>系统恢复</Text><Tag color="red" style={{ fontSize: 11 }}>延迟</Tag><Text type="secondary" style={{ fontSize: 11 }}>预计2026-06-20 18:00</Text></Space> },
                      { color: 'orange', children: <Space><Text>复核</Text><Tag color="orange" style={{ fontSize: 11 }}>有条件通过</Tag></Space> },
                      { color: 'gray', children: <Space><Text>重新纳管</Text><Tag color="default" style={{ fontSize: 11 }}>待启动</Tag></Space> }
                    ]}
                  />
                  <Row gutter={8} style={{ marginTop: 12, marginBottom: 8 }}>
                    <Col span={12}>
                      <Card size="small" title="恢复结果">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Tag color="red" style={{ width: 'fit-content' }}>未恢复</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>服务器主板备件尚未到货，预计延迟2天</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="复核结论">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Tag color="orange" style={{ width: 'fit-content' }}>有条件通过</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>允许临时启用备用服务器，正式恢复后需二次复核</Text>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                  <Card size="small" title="重新纳管业务状态">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>业务接口恢复进度</Text>
                            <Progress percent={0} size="small" status="exception" />
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>数据同步状态：</Text>
                            <Tag color="green">待同步</Tag>
                          </div>
                        </Space>
                      </Col>
                      <Col span={12}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="预计重新纳管时间">2026-06-22 10:00</Descriptions.Item>
                          <Descriptions.Item label="纳管责任人">李组长 138****0002</Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div>
                  <Space style={{ marginBottom: 8 }} wrap>
                    <Text strong style={{ fontSize: 14 }}>宁夏回族自治区农业农村厅</Text>
                    <Tag color="warning">维护中</Tag>
                    <Tag color="orange">待复核</Tag>
                    <Tag color="orange">恢复中</Tag>
                  </Space>
                  <Descriptions column={1} size="small" bordered style={{ marginBottom: 8 }}>
                    <Descriptions.Item label="原因说明">系统升级维护，V2.3版本数据库结构迁移</Descriptions.Item>
                    <Descriptions.Item label="责任单位">信息中心系统组</Descriptions.Item>
                    <Descriptions.Item label="责任人">张组长：138****0003</Descriptions.Item>
                  </Descriptions>
                  <Timeline
                    items={[
                      { color: 'green', children: <Space><Text>问题发现</Text><Tag color="green" style={{ fontSize: 11 }}>已完成</Tag><Text type="secondary" style={{ fontSize: 11 }}>2026-06-16 00:00</Text></Space> },
                      { color: 'orange', children: <Space><Text>紧急处置</Text><Tag color="orange" style={{ fontSize: 11 }}>处理中</Tag><Text type="secondary" style={{ fontSize: 11 }}>数据迁移中</Text></Space> },
                      { color: 'orange', children: <Space><Text>系统恢复</Text><Tag color="orange" style={{ fontSize: 11 }}>恢复中</Tag><Text type="secondary" style={{ fontSize: 11 }}>预计2026-06-16 20:00</Text></Space> },
                      { color: 'blue', children: <Space><Text>复核</Text><Tag color="blue" style={{ fontSize: 11 }}>待处理</Tag></Space> },
                      { color: 'orange', children: <Space><Text>重新纳管</Text><Tag color="orange" style={{ fontSize: 11 }}>准备中</Tag></Space> }
                    ]}
                  />
                  <Row gutter={8} style={{ marginTop: 12, marginBottom: 8 }}>
                    <Col span={12}>
                      <Card size="small" title="恢复结果">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Tag color="orange" style={{ width: 'fit-content' }}>恢复中</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>数据库结构迁移完成85%，正在进行数据校验</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="复核结论">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Tag color="blue" style={{ width: 'fit-content' }}>待复核</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>系统升级后需进行功能和安全性双重复核</Text>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                  <Card size="small" title="重新纳管业务状态">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>业务接口恢复进度</Text>
                            <Progress percent={85} size="small" />
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>数据同步状态：</Text>
                            <Tag color="orange">同步中</Tag>
                          </div>
                        </Space>
                      </Col>
                      <Col span={12}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="预计重新纳管时间">2026-06-17 09:00</Descriptions.Item>
                          <Descriptions.Item label="纳管责任人">张组长 138****0003</Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>
                </div>
              </div>
            }
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            closable
            style={{ marginBottom: 16 }}
          />

          <Card size="small" style={{ marginBottom: 16 }}>
            <Space wrap size="middle">
              <Input
                placeholder="搜索委办局名称或编码"
                prefix={<SearchOutlined />}
                style={{ width: 240 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                placeholder="状态筛选"
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
              >
                <Option value="all">全部状态</Option>
                <Option value="online">在线</Option>
                <Option value="offline">离线</Option>
                <Option value="maintenance">维护中</Option>
              </Select>
              <Select
                placeholder="接入等级"
                style={{ width: 120 }}
                value={levelFilter}
                onChange={setLevelFilter}
                allowClear
              >
                <Option value="all">全部等级</Option>
                <Option value="A">Level A</Option>
                <Option value="B">Level B</Option>
                <Option value="C">Level C</Option>
              </Select>
              <Select
                placeholder="部门分类"
                style={{ width: 140 }}
                value={categoryFilter}
                onChange={setCategoryFilter}
                allowClear
              >
                <Option value="all">全部分类</Option>
                {departmentCategories.map((cat) => (
                  <Option key={cat.key} value={cat.key}>{cat.title}</Option>
                ))}
              </Select>
              <Button type="primary" icon={<SyncOutlined />}>
                刷新
              </Button>
              <Space style={{ marginLeft: 'auto' }}>
                <Space.Compact>
                  <Button
                    type={viewMode === 'card' ? 'primary' : 'default'}
                    icon={<DashboardOutlined />}
                    onClick={() => setViewMode('card')}
                  >
                    卡片
                  </Button>
                  <Button
                    type={viewMode === 'table' ? 'primary' : 'default'}
                    icon={<UnorderedListOutlined />}
                    onClick={() => setViewMode('table')}
                  >
                      表格
                    </Button>
                </Space.Compact>
              </Space>
            </Space>
          </Card>

          {viewMode === 'card' ? (
            <Row gutter={[16, 16]}>
              {filteredDepartments.map((dept) => (
                <Col span={8} key={dept.id}>
                  <Card
                    hoverable={isAdminOrManager}
                    size="small"
                    onClick={() => isAdminOrManager && handleViewDetail(dept)}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <Avatar
                        size={44}
                        style={{ backgroundColor: getLevelColor(dept.level), marginRight: 12 }}
                      >
                        {dept.name.charAt(0)}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {dept.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>{dept.code}</Text>
                          <Tag color={getLevelColor(dept.level)} style={{ fontSize: 11, padding: '0 4px' }}>
                            Level {dept.level}
                          </Tag>
                        </div>
                      </div>
                      <Badge status={getStatusColor(dept.status) as any} text={getStatusText(dept.status)} />
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <Row gutter={8}>
                      <Col span={12}>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                          <ThunderboltOutlined style={{ marginRight: 4 }} />今日调用
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#0958d9' }}>
                          {dept.todayCalls.toLocaleString()}
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />平均响应
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
                          {dept.avgResponseTime}ms
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={8} style={{ marginTop: 12 }}>
                      <Col span={12}>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                          <RiseOutlined style={{ marginRight: 4 }} />成功率
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#faad14' }}>
                          {dept.successRate}%
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                          <FileTextOutlined style={{ marginRight: 4 }} />接口数
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#722ed1' }}>
                          {dept.interfaces.length}
                        </div>
                      </Col>
                    </Row>

                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        最后同步: {dept.lastSyncTime.split(' ')[1]}
                      </Text>
                      <Space size="small">
                        {isAdminOrManager && (
                          <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetail(dept)
                            }}
                          >
                            详情
                          </Button>
                        )}
                        {currentRole === 'admin' && (
                          <Button
                            type="text"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTestConnection(dept)
                            }}
                          >
                            测试
                          </Button>
                        )}
                        {isAdminOrManager && (
                          <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSyncData(dept)
                            }}
                          >
                            同步
                          </Button>
                        )}
                        {!isAdminOrManager && (
                          <Text type="secondary" style={{ fontSize: 12 }}>只读</Text>
                        )}
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Card size="small">
              <Table
                columns={tableColumns}
                dataSource={filteredDepartments}
                rowKey="id"
                pagination={{ pageSize: 10, total: filteredDepartments.length }}
                size="small"
              />
            </Card>
          )}
        </Col>
      </Row>

      <Drawer
        title={selectedDepartment?.name}
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            {currentRole === 'admin' && <Button icon={<ToolOutlined />}>配置</Button>}
            {isAdminOrManager && <Button type="primary" icon={<ReloadOutlined />}>同步数据</Button>}
            {!isAdminOrManager && <Tag color="default">只读视图</Tag>}
          </Space>
        }
      >
        {!isAdminOrManager && (
          <Alert
            message="您当前为只读权限，仅可查看公开信息"
            description="接入配置、同步测试、敏感操作等需管理员权限。所有操作均已纳入审计留痕。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Tabs defaultActiveKey="base" items={isAdminOrManager ? drawerTabs : drawerTabs.filter(t => t.key !== 'config')} />
      </Drawer>
    </div>
  )
}

export default Departments
