import { create } from 'zustand'

export interface InspirationCase {
  id: string
  title: string
  style: string
  layout: string
  budget: string
  area: string
  imageUrl: string
  rating: number
  contractor: string
  contractorScore: number
  tags: string[]
}

export interface DesignVersion {
  id: string
  name: string
  type: 'CAD' | '效果图' | '施工图'
  uploadedAt: string
  uploadedBy: string
  status: '审核中' | '已通过' | '待修改'
  annotations: number
  votes: number
}

export interface GanttTask {
  id: string
  name: string
  category: '水电' | '泥木' | '油漆' | '安装' | '软装'
  start: number
  duration: number
  progress: number
  status: 'completed' | 'in_progress' | 'delayed' | 'pending'
  assignee: string
}

export interface MaterialProduct {
  id: string
  name: string
  brand: string
  category: string
  price: number
  unit: string
  origin: string
  ecoLevel: string
  servicePackage: string
  isSelfOperated: boolean
  imageUrl: string
  sales: number
  rating: number
}

export interface InspectionIssue {
  id: string
  room: string
  description: string
  type: '墙面空鼓' | '渗水' | '裂缝' | '尺寸偏差' | '色差' | '其他'
  severity: '严重' | '一般' | '轻微'
  status: '待整改' | '整改中' | '已整改' | '已验收'
  x: number
  y: number
  createdAt: string
  assignee: string
  photoUrl: string
}

export interface BlockchainRecord {
  id: string
  type: '合同' | '支付凭证' | '验收报告' | '设计确认' | '变更单'
  title: string
  txHash: string
  blockNumber: number
  timestamp: string
  parties: string[]
  amount?: number
  status: '已确认' | '待确认' | '争议中'
}

interface PlatformState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  inspirationFilters: {
    style: string
    layout: string
    budget: string
  }
  setInspirationFilters: (filters: Partial<PlatformState['inspirationFilters']>) => void
  selectedDesignVersion: string | null
  setSelectedDesignVersion: (id: string | null) => void
  ganttView: 'week' | 'month'
  setGanttView: (view: 'week' | 'month') => void
  materialCategory: string
  setMaterialCategory: (cat: string) => void
  inspectionRoom: string
  setInspectionRoom: (room: string) => void
}

export const usePlatformStore = create<PlatformState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  inspirationFilters: { style: '', layout: '', budget: '' },
  setInspirationFilters: (filters) => set((s) => ({ inspirationFilters: { ...s.inspirationFilters, ...filters } })),
  selectedDesignVersion: null,
  setSelectedDesignVersion: (id) => set({ selectedDesignVersion: id }),
  ganttView: 'week',
  setGanttView: (view) => set({ ganttView: view }),
  materialCategory: '全部',
  setMaterialCategory: (cat) => set({ materialCategory: cat }),
  inspectionRoom: '客厅',
  setInspectionRoom: (room) => set({ inspectionRoom: room }),
}))

export const mockCases: InspirationCase[] = [
  { id: '1', title: '现代简约三居室', style: '现代简约', layout: '三室两厅', budget: '15-20万', area: '120㎡', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+minimalist+living+room+interior+design+bright+clean&image_size=landscape_16_9', rating: 4.8, contractor: '匠心装饰', contractorScore: 4.7, tags: ['极简', '收纳', '开放式'] },
  { id: '2', title: '北欧风两居小户型', style: '北欧', layout: '两室一厅', budget: '10-15万', area: '85㎡', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scandinavian+nordic+bedroom+cozy+wood+white&image_size=landscape_16_9', rating: 4.6, contractor: '宜家装饰', contractorScore: 4.5, tags: ['温馨', '原木', '明亮'] },
  { id: '3', title: '新中式四居室', style: '新中式', layout: '四室两厅', budget: '25-35万', area: '160㎡', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese+traditional+modern+living+room+elegant+wood&image_size=landscape_16_9', rating: 4.9, contractor: '东方雅居', contractorScore: 4.8, tags: ['意境', '实木', '对称'] },
  { id: '4', title: '轻奢风三居室', style: '轻奢', layout: '三室两厅', budget: '20-30万', area: '135㎡', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury+modern+dining+room+gold+marble+elegant&image_size=landscape_16_9', rating: 4.7, contractor: '鼎盛装饰', contractorScore: 4.6, tags: ['金属', '大理石', '品质'] },
  { id: '5', title: '日式原木两居', style: '日式', layout: '两室一厅', budget: '12-18万', area: '90㎡', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese+zen+interior+wood+bamboo+minimal&image_size=landscape_16_9', rating: 4.5, contractor: '和风空间', contractorScore: 4.4, tags: ['侘寂', '原木', '留白'] },
  { id: '6', title: '工业风LOFT', style: '工业风', layout: 'LOFT', budget: '18-25万', area: '110㎡', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial+loft+interior+brick+metal+concrete&image_size=landscape_16_9', rating: 4.4, contractor: '铁艺空间', contractorScore: 4.3, tags: ['砖墙', '金属', '开放'] },
]

export const mockDesignVersions: DesignVersion[] = [
  { id: 'v1', name: '平面布局方案A', type: 'CAD', uploadedAt: '2026-05-20', uploadedBy: '张设计师', status: '已通过', annotations: 5, votes: 8 },
  { id: 'v2', name: '客厅效果图-日景', type: '效果图', uploadedAt: '2026-05-25', uploadedBy: '张设计师', status: '已通过', annotations: 12, votes: 15 },
  { id: 'v3', name: '平面布局方案B', type: 'CAD', uploadedAt: '2026-05-28', uploadedBy: '李设计师', status: '审核中', annotations: 3, votes: 4 },
  { id: 'v4', name: '主卧效果图', type: '效果图', uploadedAt: '2026-06-01', uploadedBy: '张设计师', status: '待修改', annotations: 8, votes: 6 },
  { id: 'v5', name: '水电施工图', type: '施工图', uploadedAt: '2026-06-05', uploadedBy: '王工程师', status: '审核中', annotations: 2, votes: 3 },
  { id: 'v6', name: '厨房效果图', type: '效果图', uploadedAt: '2026-06-08', uploadedBy: '张设计师', status: '已通过', annotations: 6, votes: 11 },
]

export const mockGanttTasks: GanttTask[] = [
  { id: 't1', name: '水电交底', category: '水电', start: 0, duration: 3, progress: 100, status: 'completed', assignee: '王工' },
  { id: 't2', name: '水电开槽', category: '水电', start: 3, duration: 5, progress: 100, status: 'completed', assignee: '王工' },
  { id: 't3', name: '水电管线铺设', category: '水电', start: 8, duration: 7, progress: 85, status: 'in_progress', assignee: '王工' },
  { id: 't4', name: '水电验收', category: '水电', start: 15, duration: 2, progress: 0, status: 'pending', assignee: '王工' },
  { id: 't5', name: '防水施工', category: '泥木', start: 17, duration: 5, progress: 0, status: 'pending', assignee: '赵师傅' },
  { id: 't6', name: '瓷砖铺贴', category: '泥木', start: 22, duration: 10, progress: 0, status: 'pending', assignee: '赵师傅' },
  { id: 't7', name: '木工吊顶', category: '泥木', start: 22, duration: 8, progress: 0, status: 'pending', assignee: '刘师傅' },
  { id: 't8', name: '墙面找平', category: '油漆', start: 32, duration: 5, progress: 0, status: 'pending', assignee: '孙师傅' },
  { id: 't9', name: '墙面刮腻子', category: '油漆', start: 37, duration: 7, progress: 0, status: 'pending', assignee: '孙师傅' },
  { id: 't10', name: '乳胶漆施工', category: '油漆', start: 44, duration: 5, progress: 0, status: 'pending', assignee: '孙师傅' },
  { id: 't11', name: '橱柜安装', category: '安装', start: 49, duration: 4, progress: 0, status: 'pending', assignee: '安装队' },
  { id: 't12', name: '门窗安装', category: '安装', start: 49, duration: 3, progress: 0, status: 'pending', assignee: '安装队' },
  { id: 't13', name: '灯具洁具安装', category: '安装', start: 53, duration: 3, progress: 0, status: 'pending', assignee: '安装队' },
  { id: 't14', name: '家具进场', category: '软装', start: 56, duration: 3, progress: 0, status: 'pending', assignee: '软装师' },
  { id: 't15', name: '窗帘配饰', category: '软装', start: 59, duration: 2, progress: 0, status: 'delayed', assignee: '软装师' },
]

export const mockMaterials: MaterialProduct[] = [
  { id: 'm1', name: '东鹏瓷砖-云灰石纹800x800', brand: '东鹏', category: '瓷砖', price: 128, unit: '片', origin: '广东佛山', ecoLevel: 'E0', servicePackage: '送货上门+铺贴指导', isSelfOperated: true, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gray+marble+texture+floor+tile+sample&image_size=square', sales: 2340, rating: 4.8 },
  { id: 'm2', name: '立邦净味全效内墙乳胶漆', brand: '立邦', category: '涂料', price: 698, unit: '桶(18L)', origin: '上海', ecoLevel: '法国A+', servicePackage: '免费调色+施工指导', isSelfOperated: true, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=paint+bucket+nippon+paint+interior+wall&image_size=square', sales: 5670, rating: 4.9 },
  { id: 'm3', name: '圣象实木复合地板-橡木色', brand: '圣象', category: '地板', price: 268, unit: '㎡', origin: '江苏丹阳', ecoLevel: 'E0', servicePackage: '免费测量+安装', isSelfOperated: true, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oak+wood+laminated+flooring+sample&image_size=square', sales: 3890, rating: 4.7 },
  { id: 'm4', name: '九牧智能马桶S600', brand: '九牧', category: '卫浴', price: 3299, unit: '台', origin: '福建南安', ecoLevel: '-', servicePackage: '包安装+5年质保', isSelfOperated: false, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart+toilet+modern+white+ceramic&image_size=square', sales: 1240, rating: 4.6 },
  { id: 'm5', name: '欧派定制橱柜-北欧白', brand: '欧派', category: '橱柜', price: 1580, unit: '延米', origin: '广东广州', ecoLevel: 'E1', servicePackage: '免费设计+安装', isSelfOperated: false, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+white+kitchen+cabinet+clean+design&image_size=square', sales: 890, rating: 4.5 },
  { id: 'm6', name: '雷士照明LED吸顶灯', brand: '雷士', category: '灯具', price: 399, unit: '盏', origin: '广东惠州', ecoLevel: '-', servicePackage: '包安装', isSelfOperated: true, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+LED+ceiling+light+round+white&image_size=square', sales: 7680, rating: 4.7 },
  { id: 'm7', name: 'TATA木门-静音系列', brand: 'TATA', category: '门窗', price: 1899, unit: '樘', origin: '北京', ecoLevel: 'E0', servicePackage: '包测量+安装', isSelfOperated: false, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+wooden+door+white+minimalist&image_size=square', sales: 2340, rating: 4.8 },
  { id: 'm8', name: '伟星PPR水管套装', brand: '伟星', category: '管材', price: 899, unit: '套', origin: '浙江台州', ecoLevel: '-', servicePackage: '质保50年', isSelfOperated: true, imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=PPR+water+pipe+tubes+construction&image_size=square', sales: 4560, rating: 4.6 },
]

export const mockInspectionIssues: InspectionIssue[] = [
  { id: 'i1', room: '客厅', description: '东墙中上部空鼓面积约30x30cm', type: '墙面空鼓', severity: '严重', status: '待整改', x: 72, y: 35, createdAt: '2026-06-10', assignee: '赵师傅', photoUrl: '' },
  { id: 'i2', room: '客厅', description: '北窗台下方细微裂缝', type: '裂缝', severity: '轻微', status: '整改中', x: 25, y: 68, createdAt: '2026-06-10', assignee: '孙师傅', photoUrl: '' },
  { id: 'i3', room: '主卧', description: '卫生间隔壁墙面渗水痕迹', type: '渗水', severity: '严重', status: '待整改', x: 80, y: 45, createdAt: '2026-06-11', assignee: '王工', photoUrl: '' },
  { id: 'i4', room: '厨房', description: '瓷砖缝隙宽度不均匀偏差2mm', type: '尺寸偏差', severity: '一般', status: '整改中', x: 50, y: 55, createdAt: '2026-06-11', assignee: '赵师傅', photoUrl: '' },
  { id: 'i5', room: '卫生间', description: '墙面漆色差明显', type: '色差', severity: '一般', status: '已整改', x: 40, y: 30, createdAt: '2026-06-09', assignee: '孙师傅', photoUrl: '' },
  { id: 'i6', room: '次卧', description: '踢脚线处墙面空鼓', type: '墙面空鼓', severity: '轻微', status: '已验收', x: 55, y: 85, createdAt: '2026-06-08', assignee: '赵师傅', photoUrl: '' },
]

export const mockBlockchainRecords: BlockchainRecord[] = [
  { id: 'b1', type: '合同', title: '全屋装修施工合同', txHash: '0x7f3a2b...e8c91d', blockNumber: 18923456, timestamp: '2026-05-15 10:23:45', parties: ['业主-陈先生', '匠心装饰'], amount: 185000, status: '已确认' },
  { id: 'b2', type: '支付凭证', title: '首期工程款30%', txHash: '0xa1c9e4...3f72b8', blockNumber: 18923501, timestamp: '2026-05-16 14:30:12', parties: ['业主-陈先生', '匠心装饰'], amount: 55500, status: '已确认' },
  { id: 'b3', type: '设计确认', title: '设计方案V2确认书', txHash: '0x5d8f1c...9a4e27', blockNumber: 18924022, timestamp: '2026-05-28 09:15:33', parties: ['业主-陈先生', '张设计师'], status: '已确认' },
  { id: 'b4', type: '支付凭证', title: '二期工程款40%', txHash: '0x2b7e6d...c1f853', blockNumber: 18925678, timestamp: '2026-06-05 11:45:20', parties: ['业主-陈先生', '匠心装饰'], amount: 74000, status: '已确认' },
  { id: 'b5', type: '变更单', title: '厨房地砖升级变更', txHash: '0x9c4a3f...7d219e', blockNumber: 18926001, timestamp: '2026-06-08 16:20:55', parties: ['业主-陈先生', '匠心装饰'], amount: 3200, status: '已确认' },
  { id: 'b6', type: '验收报告', title: '水电隐蔽工程验收', txHash: '0x1e8b5a...4f63c2', blockNumber: 18926890, timestamp: '2026-06-12 10:05:18', parties: ['业主-陈先生', '王工程师', '监理-李工'], status: '争议中' },
  { id: 'b7', type: '支付凭证', title: '三期工程款25%', txHash: '0x6f2d9c...8b37a1', blockNumber: 0, timestamp: '待支付', parties: ['业主-陈先生', '匠心装饰'], amount: 46250, status: '待确认' },
]
