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
  Timeline
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
  AuditOutlined
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import ReactECharts from 'echarts-for-react'

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
      lastSyncTime: isOffline ? '2024-01-13 14:30:00' : isMaintenance ? '2024-01-14 18:00:00' : '2024-01-15 09:30:00',
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
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<ToolOutlined />}>
            配置
          </Button>
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
              { key: 'e1', time: '2024-01-15 08:30:12', interface: '基础信息查询', errorType: '连接超时', scope: '全部接口', status: 'recovered' },
              { key: 'e2', time: '2024-01-15 07:15:33', interface: '业务办理查询', errorType: '数据格式错误', scope: '查询接口', status: 'processing' },
              { key: 'e3', time: '2024-01-14 22:45:18', interface: '数据统计接口', errorType: '权限拒绝', scope: '统计接口', status: 'pending' },
              { key: 'e4', time: '2024-01-14 18:20:05', interface: '基础信息查询', errorType: '响应超时', scope: '查询接口', status: 'recovered' },
              { key: 'e5', time: '2024-01-14 10:10:42', interface: '业务办理查询', errorType: '证书过期', scope: '全部接口', status: 'processing' }
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
                    <Text type="secondary">2024-01-15 09:00 - 处置人：王主任</Text>
                    <div>完成系统升级，所有接口恢复正常服务，平均响应时间恢复至120ms以内</div>
                  </div>
                )
              },
              {
                color: 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>网络故障排查 <Tag color="blue">处置中</Tag></div>
                    <Text type="secondary">2024-01-14 15:30 - 处置人：张局长</Text>
                    <div>已定位网络故障原因，正在协调运营商进行线路切换</div>
                  </div>
                )
              },
              {
                color: 'orange',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>安全漏洞修复 <Tag color="orange">待确认</Tag></div>
                    <Text type="secondary">2024-01-14 10:15 - 处置人：李厅长</Text>
                    <div>发现接口安全漏洞，已提交修复方案，等待确认后实施</div>
                  </div>
                )
              },
              {
                color: 'gray',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>数据同步异常处理 <Tag color="blue">处置中</Tag></div>
                    <Text type="secondary">2024-01-13 16:45 - 处置人：赵主任</Text>
                    <div>数据同步出现格式异常，正在与数据源单位协调解决</div>
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
              { key: 'r1', reviewTime: '2024-01-15 10:30', reviewer: '安全审核组-刘工', reviewType: '接口安全复核', result: 'passed', remark: '接口安全策略符合规范要求' },
              { key: 'r2', reviewTime: '2024-01-14 14:00', reviewer: '数据审核组-陈工', reviewType: '数据合规复核', result: 'conditional', remark: '数据传输加密需升级至SM4国密标准' },
              { key: 'r3', reviewTime: '2024-01-13 09:30', reviewer: '权限审核组-周工', reviewType: '权限变更复核', result: 'passed', remark: '权限变更符合最小权限原则' },
              { key: 'r4', reviewTime: '2024-01-12 16:00', reviewer: '运维审核组-吴工', reviewType: '系统升级复核', result: 'failed', remark: '系统升级方案缺少回滚预案，需补充后重新提交' }
            ]}
            rowKey="key"
            size="small"
            pagination={false}
          />
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
                <p style={{ marginBottom: 8 }}>以下3个委办局当前未接入平台，请及时跟进：</p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li><Text strong>宁夏回族自治区中医药管理局</Text> — <Tag color="error">离线</Tag> 原因：网络连接中断，预计恢复时间：2024-01-16 10:00</li>
                  <li><Text strong>宁夏回族自治区应急管理厅</Text> — <Tag color="error">离线</Tag> 原因：服务器故障，预计恢复时间：2024-01-17 18:00</li>
                  <li><Text strong>宁夏回族自治区农业农村厅</Text> — <Tag color="warning">维护中</Tag> 原因：系统升级维护，预计恢复时间：2024-01-15 20:00</li>
                </ul>
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
                <Button.Group>
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
                </Button.Group>
              </Space>
            </Space>
          </Card>

          {viewMode === 'card' ? (
            <Row gutter={[16, 16]}>
              {filteredDepartments.map((dept) => (
                <Col span={8} key={dept.id}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => handleViewDetail(dept)}
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
            <Button icon={<ToolOutlined />}>配置</Button>
            <Button type="primary" icon={<ReloadOutlined />}>同步数据</Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="base" items={drawerTabs} />
      </Drawer>
    </div>
  )
}

export default Departments
