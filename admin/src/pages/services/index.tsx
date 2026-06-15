import React, { useState, useMemo } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tree,
  Table,
  Tag,
  Tabs,
  Modal,
  Form,
  InputNumber,
  Tooltip,
  message,
  Popconfirm,
  TreeSelect,
  Drawer,
  Timeline,
  Descriptions
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  SnippetsOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Option } = Select

interface ServiceItem {
  id: string
  code: string
  name: string
  departmentId: string
  departmentName: string
  serviceType: string
  handleType: '即办件' | '承诺件' | '上报件' | '联办件'
  timeLimit: string
  status: 'published' | 'draft' | 'offline' | 'reviewing'
  categoryId: string
  categoryName: string
  description: string
  createTime: string
  updateTime: string
  sort: number
}

interface CategoryNode {
  id: string
  name: string
  code: string
  parentId: string | null
  level: number
  sort: number
  children?: CategoryNode[]
}

interface GuideNode {
  id: string
  type: 'question' | 'option' | 'result'
  title: string
  content?: string
  children?: GuideNode[]
  serviceId?: string
  serviceName?: string
}

interface SubItem {
  id: string
  name: string
  code: string
  stage: string
  timeLimit: string
  isCharged: boolean
}

interface MaterialItem {
  id: string
  name: string
  type: string
  copies: number
  isRequired: boolean
  source: string
  format: string
}

interface AuditStep {
  step: string
  person: string
  time: string
  status: 'completed' | 'current' | 'pending'
  remark?: string
}

const departments = [
  { id: '1', name: '宁夏回族自治区公安厅' },
  { id: '2', name: '宁夏回族自治区人力资源和社会保障厅' },
  { id: '3', name: '宁夏回族自治区民政厅' },
  { id: '4', name: '宁夏回族自治区市场监督管理厅' },
  { id: '5', name: '宁夏回族自治区交通运输厅' },
  { id: '6', name: '宁夏回族自治区卫生健康委员会' },
  { id: '7', name: '宁夏回族自治区教育厅' },
  { id: '8', name: '宁夏回族自治区自然资源厅' },
  { id: '9', name: '宁夏回族自治区住房和城乡建设厅' },
  { id: '10', name: '国家税务总局宁夏回族自治区税务局' },
  { id: '11', name: '宁夏回族自治区医疗保障局' },
  { id: '12', name: '宁夏回族自治区发展和改革委员会' }
]

const serviceTypes = ['行政许可', '行政确认', '行政给付', '行政奖励', '行政裁决', '行政处罚', '行政强制', '行政检查', '公共服务', '其他']

const handleTypes: ('即办件' | '承诺件' | '上报件' | '联办件')[] = ['即办件', '承诺件', '上报件', '联办件']

const categoryData: CategoryNode[] = [
  {
    id: 'cat-1',
    name: '个人办事',
    code: 'GRBS',
    parentId: null,
    level: 1,
    sort: 1,
    children: [
      {
        id: 'cat-1-1',
        name: '户籍办理',
        code: 'GRBS-HJ',
        parentId: 'cat-1',
        level: 2,
        sort: 1,
        children: [
          { id: 'cat-1-1-1', name: '户口迁移', code: 'GRBS-HJ-QY', parentId: 'cat-1-1', level: 3, sort: 1 },
          { id: 'cat-1-1-2', name: '户口登记', code: 'GRBS-HJ-DJ', parentId: 'cat-1-1', level: 3, sort: 2 },
          { id: 'cat-1-1-3', name: '户口注销', code: 'GRBS-HJ-ZX', parentId: 'cat-1-1', level: 3, sort: 3 }
        ]
      },
      {
        id: 'cat-1-2',
        name: '社会保障',
        code: 'GRBS-SH',
        parentId: 'cat-1',
        level: 2,
        sort: 2,
        children: [
          { id: 'cat-1-2-1', name: '养老保险', code: 'GRBS-SH-YL', parentId: 'cat-1-2', level: 3, sort: 1 },
          { id: 'cat-1-2-2', name: '医疗保险', code: 'GRBS-SH-YB', parentId: 'cat-1-2', level: 3, sort: 2 },
          { id: 'cat-1-2-3', name: '失业保险', code: 'GRBS-SH-SY', parentId: 'cat-1-2', level: 3, sort: 3 }
        ]
      },
      {
        id: 'cat-1-3',
        name: '教育培训',
        code: 'GRBS-JY',
        parentId: 'cat-1',
        level: 2,
        sort: 3,
        children: [
          { id: 'cat-1-3-1', name: '学历教育', code: 'GRBS-JY-XL', parentId: 'cat-1-3', level: 3, sort: 1 },
          { id: 'cat-1-3-2', name: '职业资格', code: 'GRBS-JY-ZG', parentId: 'cat-1-3', level: 3, sort: 2 }
        ]
      },
      {
        id: 'cat-1-4',
        name: '医疗卫生',
        code: 'GRBS-YL',
        parentId: 'cat-1',
        level: 2,
        sort: 4,
        children: [
          { id: 'cat-1-4-1', name: '医疗服务', code: 'GRBS-YL-FW', parentId: 'cat-1-4', level: 3, sort: 1 },
          { id: 'cat-1-4-2', name: '公共卫生', code: 'GRBS-YL-GG', parentId: 'cat-1-4', level: 3, sort: 2 }
        ]
      }
    ]
  },
  {
    id: 'cat-2',
    name: '法人办事',
    code: 'FRBS',
    parentId: null,
    level: 1,
    sort: 2,
    children: [
      {
        id: 'cat-2-1',
        name: '设立变更',
        code: 'FRBS-SL',
        parentId: 'cat-2',
        level: 2,
        sort: 1,
        children: [
          { id: 'cat-2-1-1', name: '企业注册', code: 'FRBS-SL-ZC', parentId: 'cat-2-1', level: 3, sort: 1 },
          { id: 'cat-2-1-2', name: '企业变更', code: 'FRBS-SL-BG', parentId: 'cat-2-1', level: 3, sort: 2 }
        ]
      },
      {
        id: 'cat-2-2',
        name: '税务办理',
        code: 'FRBS-SW',
        parentId: 'cat-2',
        level: 2,
        sort: 2,
        children: [
          { id: 'cat-2-2-1', name: '税务登记', code: 'FRBS-SW-DJ', parentId: 'cat-2-2', level: 3, sort: 1 },
          { id: 'cat-2-2-2', name: '纳税申报', code: 'FRBS-SW-SB', parentId: 'cat-2-2', level: 3, sort: 2 }
        ]
      },
      {
        id: 'cat-2-3',
        name: '资质认证',
        code: 'FRBS-ZZ',
        parentId: 'cat-2',
        level: 2,
        sort: 3,
        children: [
          { id: 'cat-2-3-1', name: '建筑资质', code: 'FRBS-ZZ-JZ', parentId: 'cat-2-3', level: 3, sort: 1 },
          { id: 'cat-2-3-2', name: '经营许可', code: 'FRBS-ZZ-JY', parentId: 'cat-2-3', level: 3, sort: 2 }
        ]
      }
    ]
  },
  {
    id: 'cat-3',
    name: '主题服务',
    code: 'ZTFW',
    parentId: null,
    level: 1,
    sort: 3,
    children: [
      {
        id: 'cat-3-1',
        name: '创新创业',
        code: 'ZTFW-CX',
        parentId: 'cat-3',
        level: 2,
        sort: 1,
        children: [
          { id: 'cat-3-1-1', name: '小微企业', code: 'ZTFW-CX-XW', parentId: 'cat-3-1', level: 3, sort: 1 },
          { id: 'cat-3-1-2', name: '高校创业', code: 'ZTFW-CX-GX', parentId: 'cat-3-1', level: 3, sort: 2 }
        ]
      },
      {
        id: 'cat-3-2',
        name: '便民服务',
        code: 'ZTFW-BM',
        parentId: 'cat-3',
        level: 2,
        sort: 2,
        children: [
          { id: 'cat-3-2-1', name: '交通出行', code: 'ZTFW-BM-JT', parentId: 'cat-3-2', level: 3, sort: 1 },
          { id: 'cat-3-2-2', name: '住房公积金', code: 'ZTFW-BM-GJJ', parentId: 'cat-3-2', level: 3, sort: 2 }
        ]
      }
    ]
  },
  {
    id: 'cat-4',
    name: '部门服务',
    code: 'BMFW',
    parentId: null,
    level: 1,
    sort: 4,
    children: [
      {
        id: 'cat-4-1',
        name: '公安服务',
        code: 'BMFW-GA',
        parentId: 'cat-4',
        level: 2,
        sort: 1,
        children: [
          { id: 'cat-4-1-1', name: '交管服务', code: 'BMFW-GA-JG', parentId: 'cat-4-1', level: 3, sort: 1 },
          { id: 'cat-4-1-2', name: '出入境服务', code: 'BMFW-GA-CR', parentId: 'cat-4-1', level: 3, sort: 2 }
        ]
      },
      {
        id: 'cat-4-2',
        name: '人社服务',
        code: 'BMFW-RS',
        parentId: 'cat-4',
        level: 2,
        sort: 2,
        children: [
          { id: 'cat-4-2-1', name: '就业服务', code: 'BMFW-RS-JY', parentId: 'cat-4-2', level: 3, sort: 1 },
          { id: 'cat-4-2-2', name: '人才服务', code: 'BMFW-RS-RC', parentId: 'cat-4-2', level: 3, sort: 2 }
        ]
      }
    ]
  }
]

const serviceNamesByType: Record<string, string[]> = {
  '行政许可': [
    '营业执照核发', '施工许可证核发', '药品经营许可证核发', '医疗机构执业许可',
    '道路运输经营许可', '食品经营许可', '公共场所卫生许可', '烟草专卖零售许可',
    '特种设备使用登记', '建设项目环境影响评价审批', '建设用地规划许可', '建设工程规划许可',
    '取水许可', '林木采伐许可', '矿产资源开采许可'
  ],
  '行政确认': [
    '不动产权登记', '户籍登记', '婚姻登记', '收养登记',
    '社会保险登记', '工伤认定', '职业病诊断鉴定', '医疗事故技术鉴定',
    '交通事故责任认定', '消防验收备案', '竣工验收备案', '自主择业军队转业干部登记'
  ],
  '行政给付': [
    '最低生活保障金给付', '特困人员救助供养', '医疗救助', '临时救助',
    '养老保险待遇给付', '失业保险金给付', '工伤保险待遇给付', '生育保险待遇给付',
    '优抚对象抚恤补助', '退役士兵安置', '教育资助', '住房保障'
  ],
  '公共服务': [
    '社保卡办理', '公积金查询提取', '医保报销', '出生医学证明办理',
    '死亡证明办理', '婚育证明办理', '居住证办理', '出入境证件办理',
    '驾驶证换领', '车辆年检', '不动产信息查询', '企业信用信息查询'
  ],
  '其他': [
    '政府信息公开', '信访事项受理', '行政复议', '政协提案办理',
    '人大代表建议办理', '档案查询利用', '公证服务', '法律援助',
    '人民调解', '仲裁服务', '职业技能培训', '创业担保贷款'
  ]
}

const generateRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const flattenCategories = (nodes: CategoryNode[]): CategoryNode[] => {
  const result: CategoryNode[] = []
  const traverse = (items: CategoryNode[]) => {
    items.forEach((item) => {
      result.push(item)
      if (item.children) traverse(item.children)
    })
  }
  traverse(nodes)
  return result
}

const allCategories = flattenCategories(categoryData)
const leafCategories = allCategories.filter((c) => c.level === 3)

const generateServiceItems = (): ServiceItem[] => {
  const items: ServiceItem[] = []
  let id = 1

  Object.keys(serviceNamesByType).forEach((type) => {
    const names = serviceNamesByType[type]
    names.forEach((name) => {
      const deptIndex = generateRandomInt(0, departments.length - 1)
      const dept = departments[deptIndex]
      const catIndex = generateRandomInt(0, leafCategories.length - 1)
      const cat = leafCategories[catIndex]
      const handleType = handleTypes[generateRandomInt(0, handleTypes.length - 1)]
      const statusIndex = generateRandomInt(0, 10)
      let status: ServiceItem['status'] = 'published'
      if (statusIndex === 8) status = 'draft'
      else if (statusIndex === 9) status = 'offline'
      else if (statusIndex === 10) status = 'reviewing'

      const timeLimitDays = generateRandomInt(1, 30)
      const timeLimit = handleType === '即办件' ? '即办' : `${timeLimitDays}个工作日`

      items.push({
        id: String(id),
        code: `SX${String(id).padStart(4, '0')}`,
        name,
        departmentId: dept.id,
        departmentName: dept.name,
        serviceType: type,
        handleType,
        timeLimit,
        status,
        categoryId: cat.id,
        categoryName: cat.name,
        description: `${name}服务事项，为群众提供便捷的政务服务`,
        createTime: '2024-01-' + String(generateRandomInt(1, 15)).padStart(2, '0') + ' 10:00:00',
        updateTime: '2024-01-' + String(generateRandomInt(10, 15)).padStart(2, '0') + ' 14:30:00',
        sort: id
      })
      id++
    })
  })

  return items
}

const servicesData = generateServiceItems()

const mockSubItems: SubItem[] = [
  { id: 'sub-1', name: '受理环节', code: 'SUB-SL', stage: '受理', timeLimit: '1个工作日', isCharged: false },
  { id: 'sub-2', name: '审查环节', code: 'SUB-SC', stage: '审查', timeLimit: '3个工作日', isCharged: false },
  { id: 'sub-3', name: '决定环节', code: 'SUB-JD', stage: '决定', timeLimit: '2个工作日', isCharged: true }
]

const mockMaterials: MaterialItem[] = [
  { id: 'mat-1', name: '身份证复印件', type: '身份证明', copies: 1, isRequired: true, source: '申请人提供', format: 'A4纸复印件' },
  { id: 'mat-2', name: '营业执照', type: '资质证明', copies: 1, isRequired: true, source: '申请人提供', format: '原件及复印件' },
  { id: 'mat-3', name: '申请表', type: '申请文书', copies: 2, isRequired: true, source: '系统生成', format: 'PDF打印' },
  { id: 'mat-4', name: '承诺书', type: '申请文书', copies: 1, isRequired: false, source: '申请人提供', format: 'A4纸打印' },
  { id: 'mat-5', name: '资质证明', type: '资质证明', copies: 1, isRequired: true, source: '主管部门出具', format: '原件及复印件' }
]

const mockAuditSteps: AuditStep[] = [
  { step: '事项创建', person: '张三', time: '2024-01-10 09:00:00', status: 'completed' },
  { step: '科室审核', person: '李四', time: '2024-01-11 14:30:00', status: 'completed', remark: '审核通过' },
  { step: '领导审批', person: '王五', time: '', status: 'current' },
  { step: '发布上线', person: '', time: '', status: 'pending' }
]

const defaultGuideTree: GuideNode = {
  id: 'guide-root',
  type: 'question',
  title: '请选择您要办理的事项类型',
  children: [
    {
      id: 'q1',
      type: 'option',
      title: '我是个人办理',
      children: [
        {
          id: 'q1-1',
          type: 'question',
          title: '请问您需要办理哪类业务？',
          children: [
            {
              id: 'q1-1-1',
              type: 'option',
              title: '户籍相关',
              children: [
                {
                  id: 'r1',
                  type: 'result',
                  title: '户口迁移办理',
                  serviceId: '1',
                  serviceName: '户口迁移'
                }
              ]
            },
            {
              id: 'q1-1-2',
              type: 'option',
              title: '社保相关',
              children: [
                {
                  id: 'r2',
                  type: 'result',
                  title: '养老保险转移接续',
                  serviceId: '2',
                  serviceName: '养老保险转移接续'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'q2',
      type: 'option',
      title: '我是企业办理',
      children: [
        {
          id: 'q2-1',
          type: 'question',
          title: '请问您需要办理哪类业务？',
          children: [
            {
              id: 'q2-1-1',
              type: 'option',
              title: '企业注册',
              children: [
                {
                  id: 'r3',
                  type: 'result',
                  title: '营业执照办理',
                  serviceId: '3',
                  serviceName: '营业执照核发'
                }
              ]
            },
            {
              id: 'q2-1-2',
              type: 'option',
              title: '税务办理',
              children: [
                {
                  id: 'r4',
                  type: 'result',
                  title: '税务登记办理',
                  serviceId: '4',
                  serviceName: '税务登记'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

const Services: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list')
  const [searchText, setSearchText] = useState('')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<string[]>([])
  const [guideModalVisible, setGuideModalVisible] = useState(false)
  const [currentGuideService, setCurrentGuideService] = useState<ServiceItem | null>(null)
  const [guideTree, setGuideTree] = useState<GuideNode>(defaultGuideTree)
  const [categoryForm] = Form.useForm()
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editDrawerVisible, setEditDrawerVisible] = useState(false)
  const [currentEditService, setCurrentEditService] = useState<ServiceItem | null>(null)
  const [editForm] = Form.useForm()
  const [editActiveTab, setEditActiveTab] = useState('basic')
  const [subItems, setSubItems] = useState<SubItem[]>(mockSubItems)
  const [materials, setMaterials] = useState<MaterialItem[]>(mockMaterials)
  const [editGuideTree, setEditGuideTree] = useState<GuideNode>(defaultGuideTree)

  const treeData: DataNode[] = useMemo(() => {
    const buildTree = (nodes: CategoryNode[]): DataNode[] => {
      return nodes.map((node) => ({
        key: node.id,
        title: (
          <span>
            {node.name}
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              {node.code}
            </Text>
          </span>
        ),
        children: node.children ? buildTree(node.children) : undefined
      }))
    }
    return buildTree(categoryData)
  }, [])

  const categoryTableData = useMemo(() => {
    const flatten = (nodes: CategoryNode[], level: number = 0): any[] => {
      return nodes.flatMap((node) => [
        { ...node, key: node.id },
        ...(node.children ? flatten(node.children, level + 1) : [])
      ])
    }
    return flatten(categoryData)
  }, [])

  const filteredServices = useMemo(() => {
    return servicesData.filter((item) => {
      const matchSearch =
        item.name.includes(searchText) ||
        item.code.toLowerCase().includes(searchText.toLowerCase())
      const matchDept = deptFilter === 'all' || item.departmentId === deptFilter
      const matchType = typeFilter === 'all' || item.serviceType === typeFilter
      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      const matchCategory =
        selectedCategoryKeys.length === 0 ||
        selectedCategoryKeys.includes(item.categoryId) ||
        selectedCategoryKeys.some((key) => {
          const cat = allCategories.find((c) => c.id === key)
          if (!cat) return false
          const findInChildren = (nodes: CategoryNode[]): boolean => {
            return nodes.some(
              (n) => n.id === item.categoryId || (n.children && findInChildren(n.children))
            )
          }
          return cat.children ? findInChildren(cat.children) : false
        })
      return matchSearch && matchDept && matchType && matchStatus && matchCategory
    })
  }, [searchText, deptFilter, typeFilter, statusFilter, selectedCategoryKeys])

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredServices.slice(start, start + pageSize)
  }, [filteredServices, currentPage, pageSize])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'default'
      case 'offline':
        return 'error'
      case 'reviewing':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return '已发布'
      case 'draft':
        return '草稿'
      case 'offline':
        return '已下架'
      case 'reviewing':
        return '审核中'
      default:
        return '未知'
    }
  }

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    setSelectedCategoryKeys(selectedKeys as string[])
  }

  const handleOpenGuide = (item: ServiceItem) => {
    setCurrentGuideService(item)
    setGuideModalVisible(true)
  }

  const handleOpenEdit = (item: ServiceItem) => {
    setCurrentEditService(item)
    setEditActiveTab('basic')
    setSubItems(mockSubItems)
    setMaterials(mockMaterials)
    setEditGuideTree(defaultGuideTree)
    const days = item.timeLimit === '即办' ? 0 : parseInt(item.timeLimit) || 1
    editForm.setFieldsValue({
      timeLimitDays: days,
      fee: '免费',
      address: '宁夏回族自治区政务服务大厅',
      phone: '0951-12345'
    })
    setEditDrawerVisible(true)
  }

  const handleToggleStatus = (item: ServiceItem) => {
    const newStatus = item.status === 'published' ? 'offline' : 'published'
    message.success(`已${newStatus === 'published' ? '上架' : '下架'}：${item.name}`)
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    categoryForm.resetFields()
    setCategoryModalVisible(true)
  }

  const handleEditCategory = (record: CategoryNode) => {
    setEditingCategory(record)
    categoryForm.setFieldsValue(record)
    setCategoryModalVisible(true)
  }

  const handleDeleteCategory = (_id: string) => {
    message.success('删除成功')
  }

  const handleSaveCategory = () => {
    categoryForm.validateFields().then(() => {
      message.success(editingCategory ? '编辑成功' : '新增成功')
      setCategoryModalVisible(false)
    })
  }

  const serviceColumns: ColumnsType<ServiceItem> = [
    {
      title: '事项编码',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (code: string) => <Text code>{code}</Text>
    },
    {
      title: '事项名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record) => (
        <Tooltip title={name}>
          <a onClick={() => handleOpenGuide(record)}>{name}</a>
        </Tooltip>
      )
    },
    {
      title: '所属委办局',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 180,
      ellipsis: true
    },
    {
      title: '服务类型',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 100,
      render: (t: string) => <Tag color="blue">{t}</Tag>
    },
    {
      title: '办理方式',
      dataIndex: 'handleType',
      key: 'handleType',
      width: 90,
      render: (t: string) => {
        const colors: Record<string, string> = {
          '即办件': 'green',
          '承诺件': 'orange',
          '上报件': 'purple',
          '联办件': 'cyan'
        }
        return <Tag color={colors[t] || 'default'}>{t}</Tag>
      }
    },
    {
      title: '承诺时限',
      dataIndex: 'timeLimit',
      key: 'timeLimit',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BranchesOutlined />}
            onClick={() => handleOpenGuide(record)}
          >
            情形引导
          </Button>
          <Popconfirm
            title={`确认${record.status === 'published' ? '下架' : '上架'}该事项？`}
            onConfirm={() => handleToggleStatus(record)}
          >
            <Button type="link" size="small" danger={record.status === 'published'}>
              {record.status === 'published' ? '下架' : '上架'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const categoryColumns: ColumnsType<any> = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <span style={{ paddingLeft: record.level * 24 }}>
          {record.level < 3 && <AppstoreOutlined style={{ marginRight: 8, color: '#0958d9' }} />}
          {record.level === 3 && <FileOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />}
          {name}
        </span>
      )
    },
    { title: '分类编码', dataIndex: 'code', key: 'code', width: 160 },
    { title: '层级', dataIndex: 'level', key: 'level', width: 80, render: (l: number) => `第${l}级` },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => {}}>
            添加子级
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditCategory(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该分类？" onConfirm={() => handleDeleteCategory(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const renderGuideTree = (node: GuideNode, level: number = 0, tree: GuideNode = guideTree, setTree: React.Dispatch<React.SetStateAction<GuideNode>> = setGuideTree): React.ReactNode => {
    const nodeStyles: Record<string, { bgColor: string; borderColor: string; icon: React.ReactNode }> = {
      question: {
        bgColor: '#e6f4ff',
        borderColor: '#0958d9',
        icon: <QuestionCircleOutlined style={{ color: '#0958d9' }} />
      },
      option: {
        bgColor: '#fff7e6',
        borderColor: '#faad14',
        icon: <OrderedListOutlined style={{ color: '#faad14' }} />
      },
      result: {
        bgColor: '#f6ffed',
        borderColor: '#52c41a',
        icon: <SnippetsOutlined style={{ color: '#52c41a' }} />
      }
    }

    const style = nodeStyles[node.type]

    return (
      <div key={node.id} style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            backgroundColor: style.bgColor,
            border: `1px solid ${style.borderColor}`,
            borderRadius: 6,
            marginLeft: level * 28
          }}
        >
          {style.icon}
          <span style={{ marginLeft: 8, flex: 1, fontWeight: 500 }}>{node.title}</span>
          {node.type !== 'result' && (
            <Space size="small">
              <Button
                type="text"
                size="small"
                icon={<PlusCircleOutlined />}
                onClick={() => {
                  const newNode: GuideNode = {
                    id: `node-${Date.now()}`,
                    type: node.type === 'question' ? 'option' : 'question',
                    title: '新节点',
                    children: []
                  }
                  const updateTree = (n: GuideNode): GuideNode => {
                    if (n.id === node.id) {
                      return { ...n, children: [...(n.children || []), newNode] }
                    }
                    return { ...n, children: n.children?.map(updateTree) }
                  }
                  setTree(updateTree(tree))
                  message.success('已添加子节点')
                }}
              />
              <Popconfirm title="确认删除该节点？" onConfirm={() => {
                const deleteNode = (n: GuideNode): GuideNode | null => {
                  if (n.id === node.id) return null
                  const children = n.children?.map(deleteNode).filter(Boolean) as GuideNode[]
                  return { ...n, children }
                }
                const newTree = deleteNode(tree)
                if (newTree) setTree(newTree)
              }}>
                <Button type="text" size="small" danger icon={<MinusCircleOutlined />} />
              </Popconfirm>
            </Space>
          )}
          {node.type === 'result' && node.serviceName && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              {node.serviceName}
            </Tag>
          )}
        </div>
        {node.children && node.children.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {node.children.map((child) => renderGuideTree(child, level + 1, tree, setTree))}
          </div>
        )}
      </div>
    )
  }

  const listTabContent = (
    <Row gutter={16}>
      <Col span={5}>
        <Card
          title="事项分类"
          size="small"
          style={{ height: 'calc(100vh - 220px)', overflow: 'auto' }}
          extra={
            <Button type="link" size="small" onClick={() => setSelectedCategoryKeys([])}>
              重置
            </Button>
          }
        >
          <Tree
            checkable
            showLine
            treeData={treeData}
            checkedKeys={selectedCategoryKeys}
            onCheck={handleTreeSelect as any}
            defaultExpandAll
          />
        </Card>
      </Col>

      <Col span={19}>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap size="middle">
            <Input
              placeholder="搜索事项名称或编码"
              prefix={<SearchOutlined />}
              style={{ width: 260 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="委办局筛选"
              style={{ width: 200 }}
              value={deptFilter}
              onChange={setDeptFilter}
              allowClear
            >
              <Option value="all">全部委办局</Option>
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
            <Select
              placeholder="服务类型"
              style={{ width: 140 }}
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
            >
              <Option value="all">全部类型</Option>
              {serviceTypes.map((t) => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="all">全部状态</Option>
              <Option value="published">已发布</Option>
              <Option value="draft">草稿</Option>
              <Option value="offline">已下架</Option>
              <Option value="reviewing">审核中</Option>
            </Select>
            <Button type="primary">查询</Button>
            <Button>重置</Button>
            <Space style={{ marginLeft: 'auto' }}>
              <Button type="primary" icon={<PlusOutlined />}>
                新增事项
              </Button>
            </Space>
          </Space>
        </Card>

        <Card size="small">
          <Table
            columns={serviceColumns}
            dataSource={paginatedServices}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredServices.length,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, size) => {
                setCurrentPage(page)
                setPageSize(size)
              }
            }}
            size="small"
          />
        </Card>
      </Col>
    </Row>
  )

  const categoryTabContent = (
    <Card size="small">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}>
            新增分类
          </Button>
          <Button icon={<ArrowUpOutlined />}>上移</Button>
          <Button icon={<ArrowDownOutlined />}>下移</Button>
        </Space>
        <Text type="secondary">共 {categoryTableData.length} 个分类</Text>
      </div>
      <Table
        columns={categoryColumns}
        dataSource={categoryTableData}
        rowKey="key"
        pagination={false}
        size="small"
        expandable={{ defaultExpandAllRows: true }}
      />
    </Card>
  )

  const guideTabContent = (
    <Card size="small">
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">点击"情形引导"按钮可配置具体事项的引导流程</Text>
      </div>
      <div style={{ padding: '24px 16px', backgroundColor: '#fafafa', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={5} style={{ marginTop: 0 }}>
            <BranchesOutlined style={{ marginRight: 8 }} />
            智能情形引导配置
          </Title>
          <Text type="secondary">通过问答形式引导用户找到合适的服务事项</Text>
        </div>
        {renderGuideTree(guideTree)}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            <Button icon={<PlusOutlined />}>添加根节点</Button>
            <Button type="primary" icon={<SaveOutlined />}>
              保存配置
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  )

  const tabItems = [
    { key: 'list', label: '事项列表', icon: <SnippetsOutlined />, children: listTabContent },
    { key: 'category', label: '分类管理', icon: <AppstoreOutlined />, children: categoryTabContent },
    { key: 'guide', label: '情形引导', icon: <BranchesOutlined />, children: guideTabContent }
  ]

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        服务事项中枢
      </Title>

      <Card size="small" styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <BranchesOutlined style={{ color: '#0958d9' }} />
            {currentGuideService?.name} - 情形引导配置
          </Space>
        }
        open={guideModalVisible}
        onCancel={() => setGuideModalVisible(false)}
        width={800}
        footer={
          <Space>
            <Button onClick={() => setGuideModalVisible(false)}>取消</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => {
                message.success('情形引导配置保存成功')
                setGuideModalVisible(false)
              }}
            >
              保存配置
            </Button>
          </Space>
        }
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto', padding: '8px 0' }}>
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f7ff', borderRadius: 6 }}>
            <Text type="secondary">提示：点击节点右侧按钮可添加子节点或删除节点</Text>
          </div>
          {renderGuideTree(guideTree)}
        </div>
      </Modal>

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={categoryModalVisible}
        onCancel={() => setCategoryModalVisible(false)}
        onOk={handleSaveCategory}
        okText="保存"
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="分类编码"
            rules={[{ required: true, message: '请输入分类编码' }]}
          >
            <Input placeholder="请输入分类编码" />
          </Form.Item>
          <Form.Item name="parentId" label="上级分类">
            <TreeSelect
              treeData={treeData}
              placeholder="请选择上级分类（根节点无需选择）"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="数字越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <EditOutlined style={{ color: '#0958d9' }} />
            编辑服务事项 - {currentEditService?.name}
          </Space>
        }
        open={editDrawerVisible}
        onClose={() => setEditDrawerVisible(false)}
        width={720}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setEditDrawerVisible(false)}>取消</Button>
            <Button icon={<SaveOutlined />} onClick={() => { message.success('草稿保存成功'); setEditDrawerVisible(false) }}>
              保存草稿
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => { message.success('已提交审核'); setEditDrawerVisible(false) }}
            >
              提交审核
            </Button>
          </div>
        }
      >
        <Tabs
          activeKey={editActiveTab}
          onChange={setEditActiveTab}
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <div>
                  <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="事项名称">{currentEditService?.name}</Descriptions.Item>
                    <Descriptions.Item label="事项编码">{currentEditService?.code}</Descriptions.Item>
                    <Descriptions.Item label="所属委办局">{currentEditService?.departmentName}</Descriptions.Item>
                    <Descriptions.Item label="服务类型">{currentEditService?.serviceType}</Descriptions.Item>
                    <Descriptions.Item label="办理方式">{currentEditService?.handleType}</Descriptions.Item>
                    <Descriptions.Item label="当前时限">{currentEditService?.timeLimit}</Descriptions.Item>
                  </Descriptions>
                  <Form form={editForm} layout="vertical">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="timeLimitDays" label="承诺时限调整（天）">
                          <InputNumber min={0} max={999} style={{ width: '100%' }} suffix="个工作日" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="fee" label="收费标准">
                          <Input placeholder="请输入收费标准" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="address" label="办理地点">
                          <Input placeholder="请输入办理地点" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="phone" label="咨询电话">
                          <Input placeholder="请输入咨询电话" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </div>
              )
            },
            {
              key: 'subItems',
              label: '子项管理',
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { message.info('新增子项') }}>
                      新增子项
                    </Button>
                  </div>
                  <Table
                    dataSource={subItems}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: '子项名称', dataIndex: 'name', key: 'name' },
                      { title: '子项编码', dataIndex: 'code', key: 'code' },
                      { title: '办理环节', dataIndex: 'stage', key: 'stage' },
                      { title: '承诺时限', dataIndex: 'timeLimit', key: 'timeLimit' },
                      {
                        title: '是否收费',
                        dataIndex: 'isCharged',
                        key: 'isCharged',
                        render: (v: boolean) => v ? <Tag color="red">收费</Tag> : <Tag color="green">免费</Tag>
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 140,
                        render: (_: unknown, record: SubItem) => (
                          <Space size="small">
                            <Button type="link" size="small" onClick={() => { message.info('编辑子项') }}>编辑</Button>
                            <Popconfirm title="确认删除该子项？" onConfirm={() => setSubItems(subItems.filter(s => s.id !== record.id))}>
                              <Button type="link" size="small" danger>删除</Button>
                            </Popconfirm>
                          </Space>
                        )
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'materials',
              label: '材料规则',
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { message.info('新增材料') }}>
                      新增材料
                    </Button>
                  </div>
                  <Table
                    dataSource={materials}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: '材料名称', dataIndex: 'name', key: 'name' },
                      { title: '材料类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color="blue">{v}</Tag> },
                      { title: '份数', dataIndex: 'copies', key: 'copies' },
                      {
                        title: '是否必须',
                        dataIndex: 'isRequired',
                        key: 'isRequired',
                        render: (v: boolean) => v ? <Tag color="red">必须</Tag> : <Tag color="orange">可选</Tag>
                      },
                      { title: '来源', dataIndex: 'source', key: 'source' },
                      { title: '格式要求', dataIndex: 'format', key: 'format' },
                      {
                        title: '操作',
                        key: 'action',
                        width: 140,
                        render: (_: unknown, record: MaterialItem) => (
                          <Space size="small">
                            <Button type="link" size="small" onClick={() => { message.info('编辑材料') }}>编辑</Button>
                            <Popconfirm title="确认删除该材料？" onConfirm={() => setMaterials(materials.filter(m => m.id !== record.id))}>
                              <Button type="link" size="small" danger>删除</Button>
                            </Popconfirm>
                          </Space>
                        )
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'guide',
              label: '情形引导配置',
              children: (
                <div>
                  <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f7ff', borderRadius: 6 }}>
                    <Text type="secondary">通过问答形式引导用户找到合适的服务事项，点击节点右侧按钮可添加或删除子节点</Text>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: 8 }}>
                    {renderGuideTree(editGuideTree, 0, editGuideTree, setEditGuideTree)}
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Space>
                        <Button icon={<PlusOutlined />} onClick={() => {
                          const newNode: GuideNode = {
                            id: `node-${Date.now()}`,
                            type: 'question',
                            title: '新问题节点',
                            children: []
                          }
                          setEditGuideTree({ ...editGuideTree, children: [...(editGuideTree.children || []), newNode] })
                          message.success('已添加根节点')
                        }}>
                          添加根节点
                        </Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={() => message.success('情形引导配置保存成功')}>
                          保存配置
                        </Button>
                      </Space>
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: 'audit',
              label: '审核链路',
              children: (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <Timeline
                      items={mockAuditSteps.map((step) => ({
                        color: step.status === 'completed' ? 'green' : step.status === 'current' ? 'blue' : 'gray',
                        dot: step.status === 'completed' ? <CheckCircleOutlined style={{ fontSize: 16 }} /> :
                             step.status === 'current' ? <ClockCircleOutlined style={{ fontSize: 16 }} /> : undefined,
                        children: (
                          <div style={{ paddingBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text strong style={{ fontSize: 15 }}>{step.step}</Text>
                              <Tag color={step.status === 'completed' ? 'success' : step.status === 'current' ? 'processing' : 'default'}>
                                {step.status === 'completed' ? '已完成' : step.status === 'current' ? '审核中' : '待审核'}
                              </Tag>
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary">经办人：{step.person || '—'}</Text>
                            </div>
                            <div>
                              <Text type="secondary">时间：{step.time || '—'}</Text>
                            </div>
                            {step.remark && (
                              <div>
                                <Text type="secondary">备注：{step.remark}</Text>
                              </div>
                            )}
                          </div>
                        )
                      }))}
                    />
                  </div>
                  <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#fafafa', borderRadius: 8 }}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      size="large"
                      onClick={() => { message.success('已提交审核，等待领导审批'); setEditDrawerVisible(false) }}
                    >
                      提交审核
                    </Button>
                  </div>
                </div>
              )
            }
          ]}
        />
      </Drawer>
    </div>
  )
}

export default Services
