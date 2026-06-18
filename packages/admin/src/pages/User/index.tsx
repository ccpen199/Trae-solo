import { useState } from 'react'
import {
  Table, Card, Button, Space, Input, Select, Tag, Modal, Form, message,
  Drawer, Avatar, Descriptions, Row, Col, Statistic, Tabs
} from 'antd'
import {
  SearchOutlined, UserOutlined, TagOutlined, EyeOutlined,
  PlusOutlined, ThunderboltOutlined,
  TeamOutlined, FireOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatMoney, formatEnergy } from '@/utils'

interface UserItem {
  id: string
  username: string
  phone: string
  avatar?: string
  level: string
  totalCharges: number
  totalEnergy: number
  totalAmount: number
  tags: string[]
  registerTime: string
  vehicleType: string
  vehicleBrand: string
  lastChargeTime: string
  preferStations: string[]
  autoTags: string[]
  manualTags: string[]
  chargePreference: string
  consumptionLevel: string
  travelType: string
}

interface TagRule {
  id: string
  name: string
  condition: string
  category: string
  enabled: boolean
}

interface ChargeRecord {
  id: string
  stationName: string
  pileCode: string
  energy: number
  amount: number
  duration: number
  time: string
}

const levelMap: Record<string, { color: string; text: string }> = {
  normal: { color: 'default', text: '普通会员' },
  silver: { color: 'blue', text: '银卡会员' },
  gold: { color: 'gold', text: '金卡会员' },
  platinum: { color: 'purple', text: '铂金会员' },
  diamond: { color: 'magenta', text: '钻石会员' }
}

const autoTagList = ['高频用户', '夜间充电', '快充偏好', '慢充偏好', '通勤用户', '周末用户', '高消费', '低消费', '活跃用户', '流失预警', '长途用户', '城区用户']
const manualTagList = ['VIP客户', '投诉用户', '试用用户', '企业用户', '政府用户', '大客户', '重点维护', '新引导']
const allTags = [...autoTagList, ...manualTagList]

const tagRules: TagRule[] = [
  { id: '1', name: '高频用户', condition: '月充电次数>10', category: '充电偏好', enabled: true },
  { id: '2', name: '夜间充电', condition: '22:00-06:00充电占比>40%', category: '充电偏好', enabled: true },
  { id: '3', name: '快充偏好', condition: '快充使用率>70%', category: '充电偏好', enabled: true },
  { id: '4', name: '慢充偏好', condition: '慢充使用率>70%', category: '充电偏好', enabled: true },
  { id: '5', name: '高消费', condition: '月均消费>500元', category: '消费能力', enabled: true },
  { id: '6', name: '低消费', condition: '月均消费<100元', category: '消费能力', enabled: true },
  { id: '7', name: '通勤用户', condition: '工作日充电占比>60%', category: '出行特征', enabled: true },
  { id: '8', name: '周末用户', condition: '周末充电占比>60%', category: '出行特征', enabled: true },
  { id: '9', name: '长途用户', condition: '高速场站充电占比>50%', category: '出行特征', enabled: true },
  { id: '10', name: '城区用户', condition: '城区场站充电占比>80%', category: '出行特征', enabled: true },
  { id: '11', name: '活跃用户', condition: '近7天充电>3次', category: '活跃度', enabled: true },
  { id: '12', name: '流失预警', condition: '近30天无充电记录', category: '活跃度', enabled: true }
]

const mockUsers: UserItem[] = [
  { id: '1', username: '张伟', phone: '138****0001', level: 'gold', totalCharges: 156, totalEnergy: 2580.5, totalAmount: 3870.75, tags: ['高频用户', '快充偏好', '通勤用户', '活跃用户'], registerTime: '2023-06-15 10:30:00', vehicleType: '纯电', vehicleBrand: '特斯拉Model 3', lastChargeTime: '2024-06-18 08:30:00', preferStations: ['G2京沪-济南服务区站', 'G4京港澳-武汉站'], autoTags: ['高频用户', '快充偏好', '通勤用户', '活跃用户'], manualTags: [], chargePreference: '快充偏好', consumptionLevel: '高消费', travelType: '通勤用户' },
  { id: '2', username: '李娜', phone: '139****0002', level: 'silver', totalCharges: 45, totalEnergy: 680.2, totalAmount: 1020.3, tags: ['新用户', '慢充偏好', '城区用户'], registerTime: '2024-03-20 14:15:00', vehicleType: '插混', vehicleBrand: '比亚迪秦Plus', lastChargeTime: '2024-06-17 19:20:00', preferStations: ['G15沈海-青岛站'], autoTags: ['慢充偏好', '城区用户'], manualTags: ['试用用户'], chargePreference: '慢充偏好', consumptionLevel: '低消费', travelType: '城区用户' },
  { id: '3', username: '王强', phone: '137****0003', level: 'platinum', totalCharges: 320, totalEnergy: 5240.8, totalAmount: 7861.2, tags: ['高频用户', '夜间充电', '高消费', '活跃用户', '长途用户'], registerTime: '2023-01-10 09:00:00', vehicleType: '纯电', vehicleBrand: '蔚来ES6', lastChargeTime: '2024-06-18 06:15:00', preferStations: ['G1京哈-山海关服务区站', 'G4京港澳-郑州站', 'G2京沪-泰安站'], autoTags: ['高频用户', '夜间充电', '高消费', '活跃用户', '长途用户'], manualTags: ['VIP客户'], chargePreference: '快充偏好', consumptionLevel: '高消费', travelType: '长途用户' },
  { id: '4', username: '赵敏', phone: '136****0004', level: 'normal', totalCharges: 12, totalEnergy: 156.3, totalAmount: 234.45, tags: ['新用户', '周末用户', '低消费'], registerTime: '2024-05-01 16:45:00', vehicleType: '纯电', vehicleBrand: '小鹏P5', lastChargeTime: '2024-06-15 14:30:00', preferStations: ['G15沈海-福州站'], autoTags: ['周末用户', '低消费'], manualTags: [], chargePreference: '快充偏好', consumptionLevel: '低消费', travelType: '周末用户' },
  { id: '5', username: '钱磊', phone: '135****0005', level: 'diamond', totalCharges: 580, totalEnergy: 9850.0, totalAmount: 14775.0, tags: ['高频用户', '快充偏好', '高消费', '活跃用户', '通勤用户'], registerTime: '2022-08-20 11:20:00', vehicleType: '纯电', vehicleBrand: '特斯拉Model Y', lastChargeTime: '2024-06-18 07:45:00', preferStations: ['G2京沪-济南服务区站', 'G4京港澳-武汉站'], autoTags: ['高频用户', '快充偏好', '高消费', '活跃用户', '通勤用户'], manualTags: ['VIP客户', '大客户'], chargePreference: '快充偏好', consumptionLevel: '高消费', travelType: '通勤用户' },
  { id: '6', username: '孙丽', phone: '134****0006', level: 'gold', totalCharges: 98, totalEnergy: 1620.8, totalAmount: 2431.2, tags: ['夜间充电', '慢充偏好', '城区用户'], registerTime: '2023-09-05 08:10:00', vehicleType: '插混', vehicleBrand: '理想L7', lastChargeTime: '2024-06-18 05:30:00', preferStations: ['G15沈海-厦门站'], autoTags: ['夜间充电', '慢充偏好', '城区用户'], manualTags: [], chargePreference: '慢充偏好', consumptionLevel: '高消费', travelType: '城区用户' },
  { id: '7', username: '周杰', phone: '133****0007', level: 'silver', totalCharges: 67, totalEnergy: 980.5, totalAmount: 1470.75, tags: ['通勤用户', '快充偏好'], registerTime: '2023-11-22 13:40:00', vehicleType: '纯电', vehicleBrand: '广汽埃安S', lastChargeTime: '2024-06-17 18:00:00', preferStations: ['G4京港澳-郑州站'], autoTags: ['通勤用户', '快充偏好'], manualTags: [], chargePreference: '快充偏好', consumptionLevel: '低消费', travelType: '通勤用户' },
  { id: '8', username: '吴芳', phone: '132****0008', level: 'normal', totalCharges: 23, totalEnergy: 345.6, totalAmount: 518.4, tags: ['周末用户', '低消费', '城区用户'], registerTime: '2024-02-14 10:00:00', vehicleType: '插混', vehicleBrand: '比亚迪宋Plus', lastChargeTime: '2024-06-16 11:20:00', preferStations: ['G6京藏-张家口站'], autoTags: ['周末用户', '低消费', '城区用户'], manualTags: [], chargePreference: '慢充偏好', consumptionLevel: '低消费', travelType: '城区用户' },
  { id: '9', username: '郑浩', phone: '131****0009', level: 'platinum', totalCharges: 256, totalEnergy: 4560.3, totalAmount: 6840.45, tags: ['高频用户', '夜间充电', '长途用户', '活跃用户'], registerTime: '2023-03-18 15:30:00', vehicleType: '纯电', vehicleBrand: '蔚来ET5', lastChargeTime: '2024-06-18 03:20:00', preferStations: ['G1京哈-山海关服务区站', 'G5京昆-西安站'], autoTags: ['高频用户', '夜间充电', '长途用户', '活跃用户'], manualTags: ['VIP客户'], chargePreference: '快充偏好', consumptionLevel: '高消费', travelType: '长途用户' },
  { id: '10', username: '冯雪', phone: '130****0010', level: 'gold', totalCharges: 134, totalEnergy: 2240.8, totalAmount: 3361.2, tags: ['快充偏好', '高消费', '通勤用户', '活跃用户'], registerTime: '2023-07-08 09:15:00', vehicleType: '纯电', vehicleBrand: '小鹏G6', lastChargeTime: '2024-06-18 09:00:00', preferStations: ['G2京沪-泰安站'], autoTags: ['快充偏好', '高消费', '通勤用户', '活跃用户'], manualTags: [], chargePreference: '快充偏好', consumptionLevel: '高消费', travelType: '通勤用户' },
  { id: '11', username: '陈龙', phone: '129****0011', level: 'silver', totalCharges: 56, totalEnergy: 890.2, totalAmount: 1335.3, tags: ['城区用户', '慢充偏好'], registerTime: '2024-01-05 11:50:00', vehicleType: '插混', vehicleBrand: '问界M5', lastChargeTime: '2024-06-17 22:15:00', preferStations: ['G15沈海-青岛站', 'G15沈海-福州站'], autoTags: ['城区用户', '慢充偏好'], manualTags: ['试用用户'], chargePreference: '慢充偏好', consumptionLevel: '低消费', travelType: '城区用户' },
  { id: '12', username: '褚瑶', phone: '128****0012', level: 'diamond', totalCharges: 420, totalEnergy: 7680.5, totalAmount: 11520.75, tags: ['高频用户', '快充偏好', '高消费', '长途用户', '活跃用户'], registerTime: '2022-10-30 08:45:00', vehicleType: '纯电', vehicleBrand: '特斯拉Model S', lastChargeTime: '2024-06-18 10:30:00', preferStations: ['G4京港澳-武汉站', 'G2京沪-济南服务区站'], autoTags: ['高频用户', '快充偏好', '高消费', '长途用户', '活跃用户'], manualTags: ['VIP客户', '大客户'], chargePreference: '快充偏好', consumptionLevel: '高消费', travelType: '长途用户' },
  { id: '13', username: '卫东', phone: '127****0013', level: 'normal', totalCharges: 8, totalEnergy: 102.4, totalAmount: 153.6, tags: ['新用户', '低消费', '流失预警'], registerTime: '2024-04-20 14:30:00', vehicleType: '插混', vehicleBrand: '荣威eRX5', lastChargeTime: '2024-05-28 16:40:00', preferStations: [], autoTags: ['低消费', '流失预警'], manualTags: [], chargePreference: '慢充偏好', consumptionLevel: '低消费', travelType: '城区用户' },
  { id: '14', username: '蒋蓉', phone: '126****0014', level: 'gold', totalCharges: 112, totalEnergy: 1856.7, totalAmount: 2785.05, tags: ['夜间充电', '高消费', '城区用户', '活跃用户'], registerTime: '2023-08-12 10:20:00', vehicleType: '纯电', vehicleBrand: '极氪001', lastChargeTime: '2024-06-18 04:10:00', preferStations: ['G15沈海-厦门站'], autoTags: ['夜间充电', '高消费', '城区用户', '活跃用户'], manualTags: ['重点维护'], chargePreference: '快充偏好', consumptionLevel: '高消费', travelType: '城区用户' },
  { id: '15', username: '沈阳', phone: '125****0015', level: 'platinum', totalCharges: 289, totalEnergy: 5120.6, totalAmount: 7680.9, tags: ['高频用户', '夜间充电', '快充偏好', '高消费', '通勤用户'], registerTime: '2023-02-28 16:00:00', vehicleType: '纯电', vehicleBrand: '比亚迪汉EV', lastChargeTime: '2024-06-18 06:50:00', preferStations: ['G4京港澳-郑州站', 'G5京昆-西安站'], autoTags: ['高频用户', '夜间充电', '快充偏好', '高消费', '通勤用户'], manualTags: ['企业用户'], chargePreference: '快充偏好', consumptionLevel: '高消费', travelType: '通勤用户' },
  { id: '16', username: '韩冰', phone: '124****0016', level: 'silver', totalCharges: 78, totalEnergy: 1230.4, totalAmount: 1845.6, tags: ['周末用户', '城区用户'], registerTime: '2023-12-15 09:30:00', vehicleType: '插混', vehicleBrand: '领克08', lastChargeTime: '2024-06-16 15:20:00', preferStations: ['G6京藏-张家口站'], autoTags: ['周末用户', '城区用户'], manualTags: [], chargePreference: '慢充偏好', consumptionLevel: '低消费', travelType: '周末用户' }
]

const chargeRecords: ChargeRecord[] = [
  { id: '1', stationName: 'G2京沪-济南服务区站', pileCode: 'G2-JN-DC003', energy: 45.6, amount: 68.4, duration: 3600, time: '2024-06-18 08:30:00' },
  { id: '2', stationName: 'G4京港澳-武汉站', pileCode: 'G4-WH-DC012', energy: 52.3, amount: 78.45, duration: 4200, time: '2024-06-17 14:15:00' },
  { id: '3', stationName: 'G1京哈-山海关服务区站', pileCode: 'G1-SHG-DC008', energy: 38.9, amount: 58.35, duration: 3000, time: '2024-06-16 22:00:00' },
  { id: '4', stationName: 'G2京沪-泰安站', pileCode: 'G2-TA-DC005', energy: 28.5, amount: 42.75, duration: 2400, time: '2024-06-15 10:30:00' },
  { id: '5', stationName: 'G4京港澳-郑州站', pileCode: 'G4-ZZ-DC018', energy: 62.1, amount: 93.15, duration: 4800, time: '2024-06-14 07:00:00' }
]

const chargePrefPie = {
  title: { text: '充电偏好分布', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['35%', '65%'],
    data: [
      { value: 8, name: '快充偏好', itemStyle: { color: '#1890ff' } },
      { value: 5, name: '慢充偏好', itemStyle: { color: '#52c41a' } },
      { value: 3, name: '夜间充电', itemStyle: { color: '#722ed1' } }
    ]
  }]
}

const consumptionPie = {
  title: { text: '消费能力分布', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['35%', '65%'],
    data: [
      { value: 6, name: '高消费', itemStyle: { color: '#fa8c16' } },
      { value: 6, name: '低消费', itemStyle: { color: '#bfbfbf' } },
      { value: 4, name: '中消费', itemStyle: { color: '#1890ff' } }
    ]
  }]
}

const travelPie = {
  title: { text: '出行特征分布', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['35%', '65%'],
    data: [
      { value: 5, name: '通勤用户', itemStyle: { color: '#1890ff' } },
      { value: 3, name: '周末用户', itemStyle: { color: '#52c41a' } },
      { value: 4, name: '长途用户', itemStyle: { color: '#fa8c16' } },
      { value: 4, name: '城区用户', itemStyle: { color: '#722ed1' } }
    ]
  }]
}

const vehiclePie = {
  title: { text: '车辆类型分布', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['35%', '65%'],
    data: [
      { value: 11, name: '纯电', itemStyle: { color: '#1890ff' } },
      { value: 5, name: '插混', itemStyle: { color: '#52c41a' } }
    ]
  }]
}

function User() {
  const [data, setData] = useState<UserItem[]>(mockUsers)
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [addTagModalVisible, setAddTagModalVisible] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagCategory, setNewTagCategory] = useState<string>('manual')
  const [keyword, setKeyword] = useState('')
  const [level, setLevel] = useState<string | undefined>()
  const [tagFilter, setTagFilter] = useState<string | undefined>()
  const [activeTab, setActiveTab] = useState('list')
  const [rules, setRules] = useState<TagRule[]>(tagRules)

  const columns: ColumnsType<UserItem> = [
    {
      title: '用户', dataIndex: 'username', key: 'username',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <span>{record.username}</span>
        </Space>
      )
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '会员等级', dataIndex: 'level', key: 'level',
      render: (level: string) => { const info = levelMap[level]; return <Tag color={info.color}>{info.text}</Tag> }
    },
    { title: '车辆', dataIndex: 'vehicleBrand', key: 'vehicleBrand', width: 130, ellipsis: true },
    { title: '充电次数', dataIndex: 'totalCharges', key: 'totalCharges' },
    { title: '累计充电量', dataIndex: 'totalEnergy', key: 'totalEnergy', render: (e) => formatEnergy(e) },
    { title: '累计消费', dataIndex: 'totalAmount', key: 'totalAmount', render: (a) => formatMoney(a) },
    {
      title: '标签', dataIndex: 'tags', key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.slice(0, 3).map(tag => <Tag key={tag} color="blue" style={{ marginBottom: 2 }}>{tag}</Tag>)}
          {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
        </>
      )
    },
    {
      title: '操作', key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          <Button type="link" size="small" icon={<TagOutlined />} onClick={() => handleEditTags(record)}>标签</Button>
        </Space>
      )
    }
  ]

  const ruleColumns: ColumnsType<TagRule> = [
    { title: '标签名称', dataIndex: 'name', key: 'name' },
    { title: '规则条件', dataIndex: 'condition', key: 'condition' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="blue">{c}</Tag> },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled',
      render: (enabled: boolean) => enabled ? <Tag color="green">启用</Tag> : <Tag color="default">禁用</Tag>
    },
    {
      title: '操作', key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleToggleRule(record.id)}>
          {record.enabled ? '禁用' : '启用'}
        </Button>
      )
    }
  ]

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      let filtered = mockUsers
      if (keyword) {
        filtered = filtered.filter(item => item.username.includes(keyword) || item.phone.includes(keyword))
      }
      if (level) {
        filtered = filtered.filter(item => item.level === level)
      }
      if (tagFilter) {
        filtered = filtered.filter(item => item.tags.includes(tagFilter))
      }
      setData(filtered)
      setLoading(false)
    }, 300)
  }

  const handleView = (record: UserItem) => {
    setCurrentUser(record)
    setDetailVisible(true)
  }

  const handleEditTags = (record: UserItem) => {
    setCurrentUser(record)
    setSelectedTags([...record.tags])
    setTagModalVisible(true)
  }

  const handleSaveTags = () => {
    if (currentUser) {
      setData(data.map(item => item.id === currentUser.id ? { ...item, tags: selectedTags } : item))
      message.success('标签更新成功')
      setTagModalVisible(false)
    }
  }

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
    message.success('规则状态已更新')
  }

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      message.warning('请输入标签名称')
      return
    }
    message.success(`标签"${newTagName}"已添加`)
    setNewTagName('')
    setAddTagModalVisible(false)
  }

  const getRadarOption = (user: UserItem) => ({
    title: { text: '充电画像雷达图', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {},
    radar: {
      indicator: [
        { name: '充电频次', max: 100 },
        { name: '充电量', max: 100 },
        { name: '消费金额', max: 100 },
        { name: '快充占比', max: 100 },
        { name: '夜间占比', max: 100 },
        { name: '高速占比', max: 100 }
      ]
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          Math.min(100, user.totalCharges / 6),
          Math.min(100, user.totalEnergy / 100),
          Math.min(100, user.totalAmount / 150),
          user.chargePreference === '快充偏好' ? 85 : 25,
          user.tags.includes('夜间充电') ? 80 : 20,
          user.travelType === '长途用户' ? 75 : 20
        ],
        name: user.username,
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.2 }
      }]
    }]
  })

  const tabItems = [
    { key: 'list', label: '用户列表' },
    { key: 'tags', label: '标签管理' },
    { key: 'rules', label: '标签规则' },
    { key: 'analysis', label: '分群统计' }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="总用户数" value={data.length} prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="活跃用户" value={data.filter(u => u.tags.includes('活跃用户')).length} prefix={<FireOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="本月新增" value={3} prefix={<PlusOutlined />} valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均充电频次"
              value={data.reduce((s, u) => s + u.totalCharges, 0) / data.length}
              precision={1}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="次/人"
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {activeTab === 'list' && (
          <>
            <Space style={{ marginBottom: 16 }} wrap>
              <Input placeholder="搜索用户名/手机号" prefix={<SearchOutlined />} style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} />
              <Select placeholder="会员等级" style={{ width: 130 }} allowClear value={level} onChange={setLevel} options={Object.entries(levelMap).map(([k, v]) => ({ value: k, label: v.text }))} />
              <Select placeholder="用户标签" style={{ width: 150 }} allowClear value={tagFilter} onChange={setTagFilter} options={allTags.map(t => ({ value: t, label: t }))} />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
            </Space>
            <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ total: data.length, pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }} />
          </>
        )}

        {activeTab === 'tags' && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddTagModalVisible(true)}>新增标签</Button>
            </Space>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="系统自动标签" size="small">
                  <Space wrap>
                    {autoTagList.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="人工标签" size="small">
                  <Space wrap>
                    {manualTagList.map(tag => <Tag key={tag} color="orange">{tag}</Tag>)}
                  </Space>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {activeTab === 'rules' && (
          <Table columns={ruleColumns} dataSource={rules} rowKey="id" pagination={false} />
        )}

        {activeTab === 'analysis' && (
          <Row gutter={16}>
            <Col span={12}><Card><ReactECharts option={chargePrefPie} style={{ height: 300 }} /></Card></Col>
            <Col span={12}><Card><ReactECharts option={consumptionPie} style={{ height: 300 }} /></Card></Col>
            <Col span={12}><Card><ReactECharts option={travelPie} style={{ height: 300 }} /></Card></Col>
            <Col span={12}><Card><ReactECharts option={vehiclePie} style={{ height: 300 }} /></Card></Col>
          </Row>
        )}
      </Card>

      <Drawer title="用户详情" width={680} open={detailVisible} onClose={() => setDetailVisible(false)}>
        {currentUser && (
          <>
            <Space style={{ marginBottom: 24 }}>
              <Avatar size={64} icon={<UserOutlined />} src={currentUser.avatar} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{currentUser.username}</div>
                <Space>
                  <Tag color={levelMap[currentUser.level].color}>{levelMap[currentUser.level].text}</Tag>
                  <Tag>{currentUser.vehicleType}</Tag>
                  <Tag color="geekblue">{currentUser.vehicleBrand}</Tag>
                </Space>
              </div>
            </Space>

            <Descriptions column={2} bordered style={{ marginBottom: 24 }} size="small">
              <Descriptions.Item label="手机号">{currentUser.phone}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{formatDateTime(currentUser.registerTime)}</Descriptions.Item>
              <Descriptions.Item label="充电次数">{currentUser.totalCharges} 次</Descriptions.Item>
              <Descriptions.Item label="累计充电量">{formatEnergy(currentUser.totalEnergy)}</Descriptions.Item>
              <Descriptions.Item label="累计消费">{formatMoney(currentUser.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label="最近充电">{formatDateTime(currentUser.lastChargeTime)}</Descriptions.Item>
              <Descriptions.Item label="充电偏好"><Tag color="blue">{currentUser.chargePreference}</Tag></Descriptions.Item>
              <Descriptions.Item label="消费水平"><Tag color="orange">{currentUser.consumptionLevel}</Tag></Descriptions.Item>
              <Descriptions.Item label="出行特征"><Tag color="purple">{currentUser.travelType}</Tag></Descriptions.Item>
              <Descriptions.Item label="偏好站点">
                {currentUser.preferStations.map(s => <Tag key={s} style={{ marginBottom: 2 }}>{s}</Tag>)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="充电画像" size="small" style={{ marginBottom: 16 }}>
              <ReactECharts option={getRadarOption(currentUser)} style={{ height: 280 }} />
            </Card>

            <Card title="最近充电记录" size="small" style={{ marginBottom: 16 }}>
              <Table
                columns={[
                  { title: '场站', dataIndex: 'stationName', key: 'stationName', ellipsis: true },
                  { title: '充电量', dataIndex: 'energy', key: 'energy', render: (v) => `${v} kWh`, width: 100 },
                  { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => formatMoney(v), width: 90 },
                  { title: '时间', dataIndex: 'time', key: 'time', render: (t) => formatDateTime(t), width: 160 }
                ]}
                dataSource={chargeRecords}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </Card>

            <Card
              title="标签列表"
              size="small"
              extra={<Button type="link" size="small" icon={<TagOutlined />} onClick={() => { setSelectedTags([...currentUser.tags]); setTagModalVisible(true) }}>编辑</Button>}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <span style={{ fontWeight: 500, marginRight: 8 }}>自动标签:</span>
                  {currentUser.autoTags.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}
                </div>
                <div>
                  <span style={{ fontWeight: 500, marginRight: 8 }}>人工标签:</span>
                  {currentUser.manualTags.length > 0
                    ? currentUser.manualTags.map(tag => <Tag key={tag} color="orange">{tag}</Tag>)
                    : <span style={{ color: '#999' }}>暂无</span>
                  }
                </div>
              </Space>
            </Card>
          </>
        )}
      </Drawer>

      <Modal title="编辑用户标签" open={tagModalVisible} onOk={handleSaveTags} onCancel={() => setTagModalVisible(false)} width={500}>
        <div style={{ marginBottom: 12 }}>选择用户标签:</div>
        <Select mode="multiple" style={{ width: '100%' }} placeholder="请选择标签" value={selectedTags} onChange={setSelectedTags} options={allTags.map(tag => ({ value: tag, label: tag }))} />
      </Modal>

      <Modal title="新增标签" open={addTagModalVisible} onOk={handleAddTag} onCancel={() => setAddTagModalVisible(false)}>
        <Form layout="vertical">
          <Form.Item label="标签名称">
            <Input placeholder="请输入标签名称" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
          </Form.Item>
          <Form.Item label="标签分类">
            <Select value={newTagCategory} onChange={setNewTagCategory} options={[{ value: 'auto', label: '系统自动标签' }, { value: 'manual', label: '人工标签' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default User
