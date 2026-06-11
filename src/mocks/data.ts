import type {
  Engineer,
  ServiceItem,
  WorkOrder,
  WorkOrderStep,
  Part,
  EngineerCredit,
  ContractRecord,
  KnowledgeEntry,
  InspectionRecord,
  DiagnosisResult,
  InventoryBatch,
  StockFlowRecord,
  DispatchMatchDetail,
} from '@/types'

export const categories = [
  { key: 'air_conditioner', label: '空调维修', icon: 'Wind' },
  { key: 'water_heater', label: '热水器维修', icon: 'Flame' },
  { key: 'washing_machine', label: '洗衣机维修', icon: 'Waves' },
  { key: 'refrigerator', label: '冰箱维修', icon: 'Snowflake' },
  { key: 'tv', label: '电视维修', icon: 'Monitor' },
  { key: 'other', label: '其他家电', icon: 'Wrench' },
] as const

export const mockEngineers: Engineer[] = [
  { id: 'e1', name: '张明辉', avatar: '', skills: ['空调', '热水器', '冰箱'], rating: 4.9, creditLevel: 'S', completionRate: 98, isOnline: true, distance: 2.3, totalOrders: 1567, matchScore: 96 },
  { id: 'e2', name: '李建国', avatar: '', skills: ['洗衣机', '冰箱', '空调'], rating: 4.8, creditLevel: 'A', completionRate: 96, isOnline: true, distance: 3.5, totalOrders: 892, matchScore: 91 },
  { id: 'e3', name: '王大伟', avatar: '', skills: ['空调', '电视', '热水器'], rating: 4.7, creditLevel: 'A', completionRate: 94, isOnline: false, distance: 5.1, totalOrders: 634, matchScore: 85 },
  { id: 'e4', name: '赵雪松', avatar: '', skills: ['热水器', '冰箱', '洗衣机'], rating: 4.6, creditLevel: 'B', completionRate: 92, isOnline: true, distance: 1.8, totalOrders: 445, matchScore: 88 },
  { id: 'e5', name: '陈志强', avatar: '', skills: ['空调', '洗衣机', '电视'], rating: 4.5, creditLevel: 'B', completionRate: 90, isOnline: true, distance: 4.2, totalOrders: 312, matchScore: 79 },
  { id: 'e6', name: '刘卫东', avatar: '', skills: ['冰箱', '空调', '热水器'], rating: 4.8, creditLevel: 'A', completionRate: 95, isOnline: true, distance: 2.8, totalOrders: 721, matchScore: 93 },
  { id: 'e7', name: '孙晓峰', avatar: '', skills: ['电视', '空调'], rating: 4.4, creditLevel: 'B', completionRate: 89, isOnline: false, distance: 6.5, totalOrders: 267, matchScore: 72 },
  { id: 'e8', name: '周建军', avatar: '', skills: ['洗衣机', '热水器', '冰箱'], rating: 4.7, creditLevel: 'A', completionRate: 95, isOnline: true, distance: 3.2, totalOrders: 678, matchScore: 90 },
]

export const mockServices: ServiceItem[] = [
  {
    id: 's1', name: '空调不制冷检修', category: 'air_conditioner', categoryLabel: '空调维修',
    laborFee: 80, description: '专业检测空调不制冷原因，包含制冷剂检测、压缩机检测、管路系统检测、电气控制检测',
    estimatedDuration: '1-2小时', warranty: '90天质保', guarantees: ['免费上门检测', '原厂配件', '明码标价', '不满意免单'],
    providers: [
      { id: 'e1', name: '张明辉', avatar: '', rating: 4.9, price: 180, laborFee: 80, partsFee: 100, visitFee: 30, estimatedArrival: '30分钟', completionRate: 98, warranty: '180天', guarantees: ['原厂配件', '免费检测', '90天质保', '上门费全免'], totalOrders: 1567 },
      { id: 'e3', name: '王大伟', avatar: '', rating: 4.7, price: 160, laborFee: 80, partsFee: 80, visitFee: 20, estimatedArrival: '50分钟', completionRate: 94, warranty: '90天', guarantees: ['品牌配件', '快速上门', '30天质保', '上门费减免'], totalOrders: 634 },
      { id: 'e6', name: '刘卫东', avatar: '', rating: 4.8, price: 195, laborFee: 80, partsFee: 115, visitFee: 0, estimatedArrival: '45分钟', completionRate: 95, warranty: '365天', guarantees: ['原厂配件', '免费上门', '365天质保', '全程录像', '不满意免单'], totalOrders: 721 },
    ],
  },
  {
    id: 's2', name: '空调加氟服务', category: 'air_conditioner', categoryLabel: '空调维修',
    laborFee: 60, description: '专业空调制冷剂补充服务，采用环保R410A制冷剂，包含压力检测、泄漏检查',
    estimatedDuration: '1小时', warranty: '60天质保', guarantees: ['环保制冷剂', '压力检测', '泄漏检查'],
    providers: [
      { id: 'e1', name: '张明辉', avatar: '', rating: 4.9, price: 200, laborFee: 60, partsFee: 140, visitFee: 30, estimatedArrival: '25分钟', completionRate: 98, warranty: '90天', guarantees: ['环保R410A', '压力检测', '泄漏检查', '上门费全免'], totalOrders: 1567 },
      { id: 'e2', name: '李建国', avatar: '', rating: 4.8, price: 180, laborFee: 60, partsFee: 120, visitFee: 20, estimatedArrival: '40分钟', completionRate: 96, warranty: '60天', guarantees: ['品牌制冷剂', '标准充注', '30天质保'], totalOrders: 892 },
      { id: 'e5', name: '陈志强', avatar: '', rating: 4.5, price: 160, laborFee: 60, partsFee: 100, visitFee: 0, estimatedArrival: '35分钟', completionRate: 90, warranty: '60天', guarantees: ['进口制冷剂', '免费上门', '60天质保'], totalOrders: 312 },
    ],
  },
  {
    id: 's3', name: '空调清洗保养', category: 'air_conditioner', categoryLabel: '空调维修',
    laborFee: 100, description: '深度清洗空调内机蒸发器、风轮、滤网，去除灰尘细菌，提升制冷效果',
    estimatedDuration: '1-1.5小时', warranty: '30天质保', guarantees: ['深度清洁', '消毒杀菌', '提升制冷'],
    providers: [
      { id: 'e1', name: '张明辉', avatar: '', rating: 4.9, price: 129, laborFee: 100, partsFee: 29, visitFee: 0, estimatedArrival: '20分钟', completionRate: 98, warranty: '30天', guarantees: ['深度清洁', '消毒杀菌', '免费上门', '30天质保'], totalOrders: 1567 },
      { id: 'e3', name: '王大伟', avatar: '', rating: 4.7, price: 99, laborFee: 80, partsFee: 19, visitFee: 20, estimatedArrival: '55分钟', completionRate: 94, warranty: '15天', guarantees: ['标准清洗', '快速服务', '上门费另计'], totalOrders: 634 },
    ],
  },
  {
    id: 's4', name: '热水器漏水维修', category: 'water_heater', categoryLabel: '热水器维修',
    laborFee: 60, description: '热水器漏水检测与维修，包含密封件更换、管路修复、内胆检查',
    estimatedDuration: '1-3小时', warranty: '180天质保', guarantees: ['专业检测', '原厂配件', '质保服务'],
    providers: [
      { id: 'e1', name: '张明辉', avatar: '', rating: 4.9, price: 150, laborFee: 60, partsFee: 90, visitFee: 30, estimatedArrival: '25分钟', completionRate: 98, warranty: '180天', guarantees: ['原厂密封件', '免费检测', '180天质保', '上门费全免'], totalOrders: 1567 },
      { id: 'e4', name: '赵雪松', avatar: '', rating: 4.6, price: 130, laborFee: 60, partsFee: 70, visitFee: 20, estimatedArrival: '40分钟', completionRate: 92, warranty: '90天', guarantees: ['品牌配件', '标准工艺', '90天质保'], totalOrders: 445 },
      { id: 'e8', name: '周建军', avatar: '', rating: 4.7, price: 145, laborFee: 60, partsFee: 85, visitFee: 0, estimatedArrival: '35分钟', completionRate: 95, warranty: '180天', guarantees: ['进口密封件', '免费上门', '180天质保', '全程录像'], totalOrders: 678 },
    ],
  },
  {
    id: 's5', name: '热水器不加热维修', category: 'water_heater', categoryLabel: '热水器维修',
    laborFee: 80, description: '热水器不加热故障检测与维修，包含加热管更换、温控器检测、电路检修',
    estimatedDuration: '1-2小时', warranty: '180天质保', guarantees: ['专业检测', '原厂配件', '安全保证'],
    providers: [
      { id: 'e4', name: '赵雪松', avatar: '', rating: 4.6, price: 220, laborFee: 80, partsFee: 140, visitFee: 30, estimatedArrival: '30分钟', completionRate: 92, warranty: '180天', guarantees: ['原厂加热管', '安全检测', '180天质保'], totalOrders: 445 },
      { id: 'e1', name: '张明辉', avatar: '', rating: 4.9, price: 260, laborFee: 80, partsFee: 180, visitFee: 0, estimatedArrival: '20分钟', completionRate: 98, warranty: '365天', guarantees: ['进口加热管', '免费上门', '365天质保', '安全认证', '不满意免单'], totalOrders: 1567 },
      { id: 'e8', name: '周建军', avatar: '', rating: 4.7, price: 200, laborFee: 80, partsFee: 120, visitFee: 25, estimatedArrival: '40分钟', completionRate: 95, warranty: '90天', guarantees: ['品牌配件', '标准服务', '90天质保'], totalOrders: 678 },
    ],
  },
  {
    id: 's6', name: '洗衣机异响维修', category: 'washing_machine', categoryLabel: '洗衣机维修',
    laborFee: 70, description: '洗衣机异响检测与维修，包含轴承更换、减震器检测、皮带调整',
    estimatedDuration: '1-2小时', warranty: '90天质保', guarantees: ['专业检测', '原厂配件', '质保服务'],
    providers: [
      { id: 'e2', name: '李建国', avatar: '', rating: 4.8, price: 170, laborFee: 70, partsFee: 100, visitFee: 30, estimatedArrival: '35分钟', completionRate: 96, warranty: '90天', guarantees: ['原厂轴承', '免费检测', '90天质保'], totalOrders: 892 },
      { id: 'e5', name: '陈志强', avatar: '', rating: 4.5, price: 140, laborFee: 70, partsFee: 70, visitFee: 20, estimatedArrival: '45分钟', completionRate: 90, warranty: '60天', guarantees: ['品牌轴承', '快速服务', '60天质保'], totalOrders: 312 },
      { id: 'e8', name: '周建军', avatar: '', rating: 4.7, price: 185, laborFee: 70, partsFee: 115, visitFee: 0, estimatedArrival: '30分钟', completionRate: 95, warranty: '180天', guarantees: ['进口轴承', '免费上门', '180天质保', '减震检测'], totalOrders: 678 },
    ],
  },
  {
    id: 's7', name: '洗衣机不排水维修', category: 'washing_machine', categoryLabel: '洗衣机维修',
    laborFee: 60, description: '洗衣机不排水故障检测与维修，包含排水泵更换、管路疏通、电脑板检测',
    estimatedDuration: '1-2小时', warranty: '90天质保', guarantees: ['专业检测', '原厂配件', '质保服务'],
    providers: [
      { id: 'e2', name: '李建国', avatar: '', rating: 4.8, price: 150, laborFee: 60, partsFee: 90, visitFee: 30, estimatedArrival: '30分钟', completionRate: 96, warranty: '90天', guarantees: ['原厂排水泵', '免费检测', '90天质保'], totalOrders: 892 },
      { id: 'e4', name: '赵雪松', avatar: '', rating: 4.6, price: 135, laborFee: 60, partsFee: 75, visitFee: 25, estimatedArrival: '50分钟', completionRate: 92, warranty: '60天', guarantees: ['品牌配件', '标准服务', '60天质保'], totalOrders: 445 },
    ],
  },
  {
    id: 's8', name: '冰箱不制冷维修', category: 'refrigerator', categoryLabel: '冰箱维修',
    laborFee: 90, description: '冰箱不制冷检测与维修，包含压缩机检测、制冷剂补充、管路查漏',
    estimatedDuration: '2-3小时', warranty: '180天质保', guarantees: ['专业检测', '原厂配件', '质保服务'],
    providers: [
      { id: 'e2', name: '李建国', avatar: '', rating: 4.8, price: 220, laborFee: 90, partsFee: 130, visitFee: 30, estimatedArrival: '40分钟', completionRate: 96, warranty: '180天', guarantees: ['原厂压缩机', '免费检测', '180天质保'], totalOrders: 892 },
      { id: 'e4', name: '赵雪松', avatar: '', rating: 4.6, price: 190, laborFee: 90, partsFee: 100, visitFee: 20, estimatedArrival: '30分钟', completionRate: 92, warranty: '90天', guarantees: ['品牌压缩机', '快速上门', '90天质保'], totalOrders: 445 },
      { id: 'e6', name: '刘卫东', avatar: '', rating: 4.8, price: 260, laborFee: 90, partsFee: 170, visitFee: 0, estimatedArrival: '35分钟', completionRate: 95, warranty: '365天', guarantees: ['进口压缩机', '免费上门', '365天质保', '全程检测', '不满意免单'], totalOrders: 721 },
      { id: 'e8', name: '周建军', avatar: '', rating: 4.7, price: 210, laborFee: 90, partsFee: 120, visitFee: 25, estimatedArrival: '45分钟', completionRate: 95, warranty: '180天', guarantees: ['原厂配件', '标准工艺', '180天质保'], totalOrders: 678 },
    ],
  },
  {
    id: 's9', name: '冰箱门封条更换', category: 'refrigerator', categoryLabel: '冰箱维修',
    laborFee: 50, description: '冰箱门封条更换服务，解决冰箱门关不严、冷气泄漏问题，包含门封条定制与安装',
    estimatedDuration: '1小时', warranty: '365天质保', guarantees: ['原厂门封条', '专业安装', '质保服务'],
    providers: [
      { id: 'e2', name: '李建国', avatar: '', rating: 4.8, price: 120, laborFee: 50, partsFee: 70, visitFee: 30, estimatedArrival: '50分钟', completionRate: 96, warranty: '365天', guarantees: ['原厂门封条', '免费检测', '365天质保'], totalOrders: 892 },
      { id: 'e6', name: '刘卫东', avatar: '', rating: 4.8, price: 150, laborFee: 50, partsFee: 100, visitFee: 0, estimatedArrival: '40分钟', completionRate: 95, warranty: '365天', guarantees: ['进口门封条', '免费上门', '365天质保', '磁力检测'], totalOrders: 721 },
      { id: 'e8', name: '周建军', avatar: '', rating: 4.7, price: 110, laborFee: 50, partsFee: 60, visitFee: 20, estimatedArrival: '35分钟', completionRate: 95, warranty: '180天', guarantees: ['品牌门封条', '标准安装', '180天质保'], totalOrders: 678 },
    ],
  },
  {
    id: 's10', name: '冰箱除霜清理', category: 'refrigerator', categoryLabel: '冰箱维修',
    laborFee: 80, description: '冰箱深度除霜与清洁服务，去除蒸发器冰堵、疏通排水孔、消毒杀菌',
    estimatedDuration: '1-2小时', warranty: '30天质保', guarantees: ['深度除霜', '消毒杀菌', '疏通排水'],
    providers: [
      { id: 'e4', name: '赵雪松', avatar: '', rating: 4.6, price: 99, laborFee: 80, partsFee: 19, visitFee: 20, estimatedArrival: '25分钟', completionRate: 92, warranty: '30天', guarantees: ['深度除霜', '消毒杀菌', '上门费另计'], totalOrders: 445 },
      { id: 'e6', name: '刘卫东', avatar: '', rating: 4.8, price: 139, laborFee: 80, partsFee: 59, visitFee: 0, estimatedArrival: '30分钟', completionRate: 95, warranty: '60天', guarantees: ['深度清洁', '免费上门', '60天质保', '消毒杀菌'], totalOrders: 721 },
    ],
  },
  {
    id: 's11', name: '电视花屏维修', category: 'tv', categoryLabel: '电视维修',
    laborFee: 100, description: '电视花屏检测与维修，包含主板检测、屏幕检测、背光板维修',
    estimatedDuration: '2-4小时', warranty: '90天质保', guarantees: ['专业检测', '原厂配件', '质保服务'],
    providers: [
      { id: 'e3', name: '王大伟', avatar: '', rating: 4.7, price: 280, laborFee: 100, partsFee: 180, visitFee: 30, estimatedArrival: '60分钟', completionRate: 94, warranty: '90天', guarantees: ['原厂配件', '免费检测', '90天质保'], totalOrders: 634 },
      { id: 'e7', name: '孙晓峰', avatar: '', rating: 4.4, price: 240, laborFee: 100, partsFee: 140, visitFee: 25, estimatedArrival: '50分钟', completionRate: 89, warranty: '60天', guarantees: ['品牌配件', '快速服务', '60天质保'], totalOrders: 267 },
    ],
  },
  {
    id: 's12', name: '电视无法开机维修', category: 'tv', categoryLabel: '电视维修',
    laborFee: 90, description: '电视无法开机故障检测与维修，包含电源板检测、主板检测、保险丝更换',
    estimatedDuration: '1-3小时', warranty: '90天质保', guarantees: ['专业检测', '原厂配件', '质保服务'],
    providers: [
      { id: 'e3', name: '王大伟', avatar: '', rating: 4.7, price: 200, laborFee: 90, partsFee: 110, visitFee: 30, estimatedArrival: '55分钟', completionRate: 94, warranty: '90天', guarantees: ['原厂电源板', '免费检测', '90天质保'], totalOrders: 634 },
      { id: 'e5', name: '陈志强', avatar: '', rating: 4.5, price: 180, laborFee: 90, partsFee: 90, visitFee: 20, estimatedArrival: '40分钟', completionRate: 90, warranty: '60天', guarantees: ['品牌配件', '标准服务', '60天质保'], totalOrders: 312 },
    ],
  },
]

export const mockDiagnosisResult: DiagnosisResult = {
  category: 'air_conditioner',
  categoryLabel: '空调',
  faultType: '制冷剂不足',
  confidence: 92,
  description: '检测到空调可能存在制冷剂泄漏或不足的问题，导致制冷效果下降。建议尽快安排专业工程师上门检测，避免压缩机长时间空转损坏。',
  recommendedServices: [
    { id: 's1', name: '空调不制冷检修', estimatedPrice: { min: 150, max: 300 }, estimatedDuration: '1-2小时', urgency: 'medium' },
    { id: 's2', name: '空调加氟服务', estimatedPrice: { min: 200, max: 400 }, estimatedDuration: '1小时', urgency: 'high' },
    { id: 's3', name: '空调清洗保养', estimatedPrice: { min: 99, max: 150 }, estimatedDuration: '1-1.5小时', urgency: 'low' },
  ],
}

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo1', orderId: 'SO2026061101', engineerId: 'e1', userId: 'u1', status: 'pending',
    category: 'air_conditioner', categoryLabel: '空调维修', faultDescription: '空调不制冷，疑似制冷剂不足，已使用3年未加氟',
    beforePhotos: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1631138356242-5fb75719d84e?w=400&h=300&fit=crop',
    ],
    afterPhotos: [],
    steps: [
      { index: 1, title: '到场确认', description: '确认用户报修问题，检查空调外观与运行状态', status: 'pending' },
      { index: 2, title: '故障检测', description: '检测制冷系统压力、温度传感器、压缩机运行电流', status: 'pending' },
      { index: 3, title: '维修处理', description: '补充制冷剂或修复泄漏点，更换故障部件', status: 'pending' },
      { index: 4, title: '功能测试', description: '开机测试制冷效果，确认恢复正常并清洁现场', status: 'pending' },
    ],
    createdAt: '2026-06-11 09:30', customerName: '刘女士', customerAddress: '阳光花园3栋502室', customerPhone: '138****6789',
  },
  {
    id: 'wo2', orderId: 'SO2026061102', engineerId: 'e1', userId: 'u2', status: 'completed',
    category: 'water_heater', categoryLabel: '热水器维修', faultDescription: '热水器底部漏水，每天约漏半盆水，使用5年',
    beforePhotos: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop',
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    ],
    steps: [
      { index: 1, title: '到场确认', description: '确认漏水位置和程度，关闭进水阀门', status: 'done' },
      { index: 2, title: '故障检测', description: '检测漏水原因，确认密封件损坏、内胆无腐蚀', status: 'done' },
      { index: 3, title: '维修处理', description: '更换密封件，修复管路连接，清理水垢', status: 'done' },
      { index: 4, title: '功能测试', description: '通水通电测试，确认不再漏水且加热正常', status: 'done' },
    ],
    createdAt: '2026-06-11 08:00', customerName: '王先生', customerAddress: '翠湖花园12栋301室', customerPhone: '139****1234',
  },
  {
    id: 'wo3', orderId: 'SO2026061005', engineerId: 'e1', userId: 'u3', status: 'cost_confirmed',
    category: 'washing_machine', categoryLabel: '洗衣机维修', faultDescription: '洗衣机脱水时异响严重，震动大，使用4年',
    beforePhotos: [
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop',
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop',
    ],
    steps: [
      { index: 1, title: '到场确认', description: '确认异响情况，检查洗衣机安装状态', status: 'done' },
      { index: 2, title: '故障检测', description: '检测轴承磨损情况、减震器状态、皮带松紧', status: 'done' },
      { index: 3, title: '维修处理', description: '更换轴承和油封，调整减震器', status: 'done' },
      { index: 4, title: '功能测试', description: '试运行脱水模式，确认无异响、震动正常', status: 'done' },
    ],
    createdAt: '2026-06-09 14:00', completedAt: '2026-06-09 16:30', signedAt: '2026-06-09 16:35',
    customerName: '张女士', customerAddress: '金地华府8栋1801室', customerPhone: '137****5678',
  },
  {
    id: 'wo4', orderId: 'SO2026060807', engineerId: 'e1', userId: 'u4', status: 'archived',
    category: 'refrigerator', categoryLabel: '冰箱维修', faultDescription: '冰箱冷藏室温度不够低，食物容易坏',
    beforePhotos: [
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=300&fit=crop',
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1613483187003-71c3386693db?w=400&h=300&fit=crop',
    ],
    steps: [
      { index: 1, title: '到场确认', description: '确认制冷效果，检查冰箱运行状态', status: 'done' },
      { index: 2, title: '故障检测', description: '检测制冷剂压力、压缩机运行、门封条密封', status: 'done' },
      { index: 3, title: '维修处理', description: '补充制冷剂，调整门封条', status: 'done' },
      { index: 4, title: '功能测试', description: '运行2小时，确认温度达标', status: 'done' },
    ],
    createdAt: '2026-06-08 10:00', completedAt: '2026-06-08 13:00', signedAt: '2026-06-08 13:15',
    customerName: '李先生', customerAddress: '万科城5栋203室', customerPhone: '136****2345',
  },
  {
    id: 'wo5', orderId: 'SO2026061103', engineerId: 'e1', userId: 'u5', status: 'pending',
    category: 'refrigerator', categoryLabel: '冰箱维修', faultDescription: '冰箱完全不制冷，冷冻室食物已解冻，压缩机不启动',
    beforePhotos: [], afterPhotos: [],
    steps: [
      { index: 1, title: '到场确认', description: '确认故障现象，检查供电情况', status: 'pending' },
      { index: 2, title: '故障检测', description: '检测压缩机、启动器、温控器、制冷剂', status: 'pending' },
      { index: 3, title: '维修处理', description: '更换故障部件，维修或补充制冷剂', status: 'pending' },
      { index: 4, title: '功能测试', description: '运行测试，确认制冷恢复正常', status: 'pending' },
    ],
    createdAt: '2026-06-11 10:15', customerName: '陈先生', customerAddress: '中海国际6栋1501室', customerPhone: '135****7890',
  },
]

export const mockParts: Part[] = [
  { id: 'p1', name: '空调压缩机', category: 'air_conditioner', supplierId: 'sp1', price: 580, stock: 23, qrCode: 'QR-AC-COMP-001', verified: true, image: '' },
  { id: 'p2', name: '制冷剂R410A', category: 'air_conditioner', supplierId: 'sp1', price: 120, stock: 56, qrCode: 'QR-AC-REF-001', verified: true, image: '' },
  { id: 'p3', name: '空调主板', category: 'air_conditioner', supplierId: 'sp1', price: 350, stock: 12, qrCode: 'QR-AC-BOARD-001', verified: true, image: '' },
  { id: 'p4', name: '空调电容', category: 'air_conditioner', supplierId: 'sp2', price: 45, stock: 89, qrCode: 'QR-AC-CAP-001', verified: true, image: '' },
  { id: 'p5', name: '热水器密封件套装', category: 'water_heater', supplierId: 'sp2', price: 35, stock: 120, qrCode: 'QR-WH-SEAL-001', verified: true, image: '' },
  { id: 'p6', name: '热水器加热管', category: 'water_heater', supplierId: 'sp2', price: 180, stock: 34, qrCode: 'QR-WH-HEAT-001', verified: true, image: '' },
  { id: 'p7', name: '热水器温控器', category: 'water_heater', supplierId: 'sp3', price: 65, stock: 5, qrCode: 'QR-WH-CTRL-001', verified: false, image: '' },
  { id: 'p8', name: '洗衣机轴承', category: 'washing_machine', supplierId: 'sp2', price: 85, stock: 45, qrCode: 'QR-WM-BRG-001', verified: true, image: '' },
  { id: 'p9', name: '洗衣机排水泵', category: 'washing_machine', supplierId: 'sp3', price: 120, stock: 28, qrCode: 'QR-WM-PUMP-001', verified: true, image: '' },
  { id: 'p10', name: '冰箱压缩机', category: 'refrigerator', supplierId: 'sp1', price: 680, stock: 8, qrCode: 'QR-RF-COMP-001', verified: true, image: '' },
  { id: 'p11', name: '冰箱温控器', category: 'refrigerator', supplierId: 'sp3', price: 65, stock: 3, qrCode: 'QR-RF-CTRL-001', verified: false, image: '' },
  { id: 'p12', name: '冰箱门封条', category: 'refrigerator', supplierId: 'sp2', price: 75, stock: 42, qrCode: 'QR-RF-SEAL-001', verified: true, image: '' },
  { id: 'p13', name: '电视电源板', category: 'tv', supplierId: 'sp3', price: 220, stock: 15, qrCode: 'QR-TV-PWR-001', verified: true, image: '' },
  { id: 'p14', name: '电视背光板', category: 'tv', supplierId: 'sp1', price: 280, stock: 6, qrCode: 'QR-TV-BACK-001', verified: true, image: '' },
]

export const mockInventoryBatches: InventoryBatch[] = [
  { id: 'b1', partId: 'p1', partName: '空调压缩机', batchNo: 'B20260601001', quantity: 15, supplierName: '格力原厂配件', inboundDate: '2026-06-01', expireDate: '2028-06-01', verified: true, verifiedBy: '质检员张工', verifiedAt: '2026-06-02 10:30' },
  { id: 'b2', partId: 'p2', partName: '制冷剂R410A', batchNo: 'B20260605002', quantity: 50, supplierName: '美的环保制冷剂', inboundDate: '2026-06-05', expireDate: '2027-06-05', verified: true, verifiedBy: '质检员李工', verifiedAt: '2026-06-05 14:20' },
  { id: 'b3', partId: 'p10', partName: '冰箱压缩机', batchNo: 'B20260608003', quantity: 8, supplierName: '海尔原厂配件', inboundDate: '2026-06-08', expireDate: '2028-06-08', verified: true, verifiedBy: '质检员张工', verifiedAt: '2026-06-08 11:00' },
  { id: 'b4', partId: 'p7', partName: '热水器温控器', batchNo: 'B20260610004', quantity: 20, supplierName: '万和配件', inboundDate: '2026-06-10', expireDate: '2027-06-10', verified: false },
  { id: 'b5', partId: 'p11', partName: '冰箱温控器', batchNo: 'B20260609005', quantity: 10, supplierName: '第三方供应商', inboundDate: '2026-06-09', expireDate: '2027-06-09', verified: false },
]

export const mockStockFlows: StockFlowRecord[] = [
  { id: 'f1', partId: 'p1', partName: '空调压缩机', type: 'inbound', quantity: 15, beforeStock: 8, afterStock: 23, operator: '仓管员王', reason: '采购入库', timestamp: '2026-06-01 10:30' },
  { id: 'f2', partId: 'p1', partName: '空调压缩机', type: 'outbound', quantity: 2, beforeStock: 23, afterStock: 21, operator: '工程师张', reason: '工单 SO2026052801 使用', timestamp: '2026-06-03 09:15', orderId: 'SO2026052801' },
  { id: 'f3', partId: 'p2', partName: '制冷剂R410A', type: 'inbound', quantity: 50, beforeStock: 6, afterStock: 56, operator: '仓管员王', reason: '采购入库', timestamp: '2026-06-05 14:20' },
  { id: 'f4', partId: 'p8', partName: '洗衣机轴承', type: 'outbound', quantity: 1, beforeStock: 46, afterStock: 45, operator: '工程师李', reason: '工单 SO2026060905 使用', timestamp: '2026-06-09 14:45', orderId: 'SO2026060905' },
  { id: 'f5', partId: 'p10', partName: '冰箱压缩机', type: 'inbound', quantity: 8, beforeStock: 0, afterStock: 8, operator: '仓管员李', reason: '采购入库', timestamp: '2026-06-08 11:00' },
  { id: 'f6', partId: 'p6', partName: '热水器加热管', type: 'outbound', quantity: 3, beforeStock: 37, afterStock: 34, operator: '工程师赵', reason: '工单 SO2026060602 使用', timestamp: '2026-06-06 10:00', orderId: 'SO2026060602' },
  { id: 'f7', partId: 'p7', partName: '热水器温控器', type: 'adjust', quantity: -2, beforeStock: 7, afterStock: 5, operator: '质检部', reason: '质检不合格报损', timestamp: '2026-06-07 16:30' },
  { id: 'f8', partId: 'p12', partName: '冰箱门封条', type: 'inbound', quantity: 30, beforeStock: 12, afterStock: 42, operator: '仓管员王', reason: '采购入库', timestamp: '2026-06-10 09:00' },
]

export const mockDispatchMatches: DispatchMatchDetail[] = [
  {
    engineerId: 'e1', engineerName: '张明辉', totalScore: 96,
    distanceScore: 95, skillScore: 100, performanceScore: 98, creditScore: 92,
    distanceKm: 2.3, matchedSkills: ['空调', '热水器'], missingSkills: [],
    completionRate: 98, avgRating: 4.9, estimatedArrival: '30分钟',
  },
  {
    engineerId: 'e6', engineerName: '刘卫东', totalScore: 93,
    distanceScore: 88, skillScore: 100, performanceScore: 95, creditScore: 90,
    distanceKm: 2.8, matchedSkills: ['空调', '冰箱'], missingSkills: [],
    completionRate: 95, avgRating: 4.8, estimatedArrival: '35分钟',
  },
  {
    engineerId: 'e2', engineerName: '李建国', totalScore: 91,
    distanceScore: 82, skillScore: 95, performanceScore: 96, creditScore: 88,
    distanceKm: 3.5, matchedSkills: ['空调'], missingSkills: ['热水器'],
    completionRate: 96, avgRating: 4.8, estimatedArrival: '40分钟',
  },
  {
    engineerId: 'e8', engineerName: '周建军', totalScore: 88,
    distanceScore: 86, skillScore: 85, performanceScore: 95, creditScore: 86,
    distanceKm: 3.2, matchedSkills: ['空调', '热水器'], missingSkills: [],
    completionRate: 95, avgRating: 4.7, estimatedArrival: '45分钟',
  },
]

export const mockCredits: EngineerCredit[] = [
  {
    engineerId: 'e1', name: '张明辉', avatar: '', score: 96, level: 'S', totalOrders: 1567,
    completionRate: 98, avgRating: 4.9, aiInspectionPassRate: 97,
    creditHistory: [
      { date: '2026-06-10', event: '服务好评+5分', scoreChange: 5, currentScore: 96 },
      { date: '2026-06-08', event: 'AI质检通过+2分', scoreChange: 2, currentScore: 91 },
      { date: '2026-06-05', event: '超时扣分-3分', scoreChange: -3, currentScore: 89 },
      { date: '2026-06-01', event: '服务好评+5分', scoreChange: 5, currentScore: 92 },
      { date: '2026-05-28', event: '连续10单好评+10分', scoreChange: 10, currentScore: 87 },
      { date: '2026-05-20', event: '客户投诉-10分', scoreChange: -10, currentScore: 77 },
      { date: '2026-05-15', event: '获得S级工程师+20分', scoreChange: 20, currentScore: 87 },
    ],
  },
  {
    engineerId: 'e2', name: '李建国', avatar: '', score: 88, level: 'A', totalOrders: 892,
    completionRate: 96, avgRating: 4.8, aiInspectionPassRate: 94,
    creditHistory: [
      { date: '2026-06-09', event: '服务好评+5分', scoreChange: 5, currentScore: 88 },
      { date: '2026-06-06', event: 'AI质检通过+2分', scoreChange: 2, currentScore: 83 },
      { date: '2026-06-02', event: '客户投诉-8分', scoreChange: -8, currentScore: 81 },
      { date: '2026-05-30', event: '服务好评+5分', scoreChange: 5, currentScore: 89 },
      { date: '2026-05-25', event: 'A级工程师认证+10分', scoreChange: 10, currentScore: 84 },
    ],
  },
  {
    engineerId: 'e3', name: '王大伟', avatar: '', score: 78, level: 'B', totalOrders: 634,
    completionRate: 94, avgRating: 4.7, aiInspectionPassRate: 90,
    creditHistory: [
      { date: '2026-06-07', event: '服务好评+5分', scoreChange: 5, currentScore: 78 },
      { date: '2026-06-03', event: '超时扣分-3分', scoreChange: -3, currentScore: 73 },
      { date: '2026-05-28', event: 'AI质检未通过-5分', scoreChange: -5, currentScore: 76 },
    ],
  },
  {
    engineerId: 'e6', name: '刘卫东', avatar: '', score: 91, level: 'A', totalOrders: 721,
    completionRate: 95, avgRating: 4.8, aiInspectionPassRate: 95,
    creditHistory: [
      { date: '2026-06-10', event: '服务好评+5分', scoreChange: 5, currentScore: 91 },
      { date: '2026-06-05', event: 'AI质检通过+2分', scoreChange: 2, currentScore: 86 },
      { date: '2026-06-01', event: '连续5单0投诉+8分', scoreChange: 8, currentScore: 84 },
    ],
  },
  {
    engineerId: 'e8', name: '周建军', avatar: '', score: 85, level: 'B', totalOrders: 678,
    completionRate: 95, avgRating: 4.7, aiInspectionPassRate: 92,
    creditHistory: [
      { date: '2026-06-08', event: '服务好评+5分', scoreChange: 5, currentScore: 85 },
      { date: '2026-06-02', event: '服务好评+5分', scoreChange: 5, currentScore: 80 },
    ],
  },
]

export const mockContracts: ContractRecord[] = [
  {
    id: 'ct1', orderId: 'SO2026060905', customerName: '张女士', engineerName: '张明辉',
    templateId: 'tpl-standard', status: 'archived', signedAt: '2026-06-09 16:35',
    archiveHash: '0x7a3f8b2c1d9e4f6a8b0c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f1a3b5c7d9e',
    evidenceChain: [
      { type: 'contract', hash: '0x1a2b3c4d...', timestamp: '2026-06-09 14:00', description: '服务合同生成（电子）' },
      { type: 'photo_before', hash: '0x3c4d5e6f...', timestamp: '2026-06-09 14:10', description: '维修前照片已上传存证' },
      { type: 'photo_after', hash: '0x5e6f7a8b...', timestamp: '2026-06-09 16:25', description: '维修后照片已上传存证' },
      { type: 'signature', hash: '0x7a8b9c0d...', timestamp: '2026-06-09 16:35', description: '用户电子签字确认' },
      { type: 'inspection', hash: '0x9c0d1e2f...', timestamp: '2026-06-09 18:00', description: 'AI质检抽检通过' },
    ],
  },
  {
    id: 'ct2', orderId: 'SO2026061102', customerName: '王先生', engineerName: '张明辉',
    templateId: 'tpl-standard', status: 'pending_sign',
    evidenceChain: [
      { type: 'contract', hash: '0xaa1b2c3d...', timestamp: '2026-06-11 08:00', description: '服务合同待签' },
    ],
  },
  {
    id: 'ct3', orderId: 'SO2026061003', customerName: '赵先生', engineerName: '李建国',
    templateId: 'tpl-standard', status: 'signed', signedAt: '2026-06-10 17:20',
    archiveHash: '0x8b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    evidenceChain: [
      { type: 'contract', hash: '0xbb2c3d4e...', timestamp: '2026-06-10 09:00', description: '服务合同生成（电子）' },
      { type: 'photo_before', hash: '0xcc3d4e5f...', timestamp: '2026-06-10 09:15', description: '维修前照片已上传存证' },
      { type: 'photo_after', hash: '0xdd4e5f6a...', timestamp: '2026-06-10 17:00', description: '维修后照片已上传存证' },
      { type: 'signature', hash: '0xee5f6a7b...', timestamp: '2026-06-10 17:20', description: '用户电子签字确认' },
    ],
  },
  {
    id: 'ct4', orderId: 'SO2026060807', customerName: '李先生', engineerName: '张明辉',
    templateId: 'tpl-standard', status: 'archived', signedAt: '2026-06-08 13:15',
    archiveHash: '0x9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    evidenceChain: [
      { type: 'contract', hash: '0xff6a7b8c...', timestamp: '2026-06-08 10:00', description: '服务合同生成（电子）' },
      { type: 'photo_before', hash: '0x117b8c9d...', timestamp: '2026-06-08 10:15', description: '维修前照片已上传存证' },
      { type: 'photo_after', hash: '0x228c9d0e...', timestamp: '2026-06-08 13:00', description: '维修后照片已上传存证' },
      { type: 'signature', hash: '0x339d0e1f...', timestamp: '2026-06-08 13:15', description: '用户电子签字确认' },
      { type: 'inspection', hash: '0x440e1f2a...', timestamp: '2026-06-08 15:00', description: 'AI质检抽检通过' },
    ],
  },
]

export const mockKnowledge: KnowledgeEntry[] = [
  { id: 'k1', title: '格力空调E1故障代码处理', category: 'air_conditioner', brand: '格力', content: 'E1代码表示压缩机高压保护。常见原因：1. 室外机散热不良，需清洗冷凝器；2. 制冷剂充注过量，需释放部分制冷剂；3. 系统管路堵塞，需清洗毛细管与过滤器；4. 高压开关故障，需更换或调试。处理步骤：先检查室外机环境，再测量系统压力，最后排查电气部件。', lastUpdated: '2026-06-01' },
  { id: 'k2', title: '美的热水器E5故障代码处理', category: 'water_heater', brand: '美的', content: 'E5代码表示出水温度传感器故障。故障现象：温度显示异常或无法加热。处理方法：1. 检查温度传感器接线是否松动；2. 用万用表测量传感器阻值，常温下约10KΩ；3. 如阻值异常，更换同型号温度传感器；4. 检查主控板接口电路。', lastUpdated: '2026-05-28' },
  { id: 'k3', title: '海尔洗衣机F8故障代码处理', category: 'washing_machine', brand: '海尔', content: 'F8代码表示水位传感器异常。可能原因：1. 水位传感器气管脱落或堵塞；2. 水位传感器本身故障；3. 主控板水位检测电路故障。处理步骤：检查气管连接 → 清理压力管 → 更换传感器 → 检测主板。', lastUpdated: '2026-05-20' },
  { id: 'k4', title: '西门子冰箱常见故障排查', category: 'refrigerator', brand: '西门子', content: '常见故障排查流程：不制冷 → 检查压缩机是否工作 → 检查制冷剂 → 检查温控器。异响 → 检查风机 → 检查压缩机脚垫 → 检查管路共振。漏水 → 检查排水孔 → 检查门封条 → 检查化霜系统。建议按从易到难的顺序排查。', lastUpdated: '2026-06-05' },
  { id: 'k5', title: 'TCL电视背光故障维修指南', category: 'tv', brand: 'TCL', content: '背光故障表现为画面暗或无显示但有声音。维修步骤：1. 测量背光板供电电压；2. 检测背光驱动板保险丝；3. 检查LED灯珠是否损坏；4. 更换背光板或灯条。注意：更换灯条时建议整套更换，避免亮度不均。', lastUpdated: '2026-05-15' },
  { id: 'k6', title: '空调加氟标准操作流程', category: 'air_conditioner', brand: '通用', content: '标准加氟流程：1. 开机运行制冷模式15分钟；2. 连接压力表组到检修阀；3. 观察低压压力，正常应在0.4-0.5MPa；4. 如压力低，缓慢充注制冷剂；5. 观察电流表，电流接近额定值时停止；6. 用肥皂水检测接口是否泄漏；7. 运行30分钟，确认制冷效果。', lastUpdated: '2026-06-03' },
  { id: 'k7', title: '冰箱制冷剂补充操作规范', category: 'refrigerator', brand: '通用', content: '冰箱补充制冷剂注意事项：1. 必须使用同型号制冷剂；2. 充注前必须抽真空；3. 定量充注，参考铭牌标注量；4. 充注后运行2小时观察温度；5. R600a制冷剂需注意防爆。严禁过量充注，以免损坏压缩机。', lastUpdated: '2026-05-25' },
  { id: 'k8', title: '洗衣机轴承更换步骤详解', category: 'washing_machine', brand: '通用', content: '轴承更换标准流程：1. 拆卸洗衣机后盖板；2. 拆下皮带和皮带轮；3. 卸下内桶固定螺母；4. 取出内桶总成；5. 使用拉马拆下旧轴承和油封；6. 清洁轴承座，涂抹润滑脂；7. 压入新轴承和油封；8. 按相反顺序组装；9. 试运行确认无异响。', lastUpdated: '2026-06-02' },
]

export const mockInspections: InspectionRecord[] = [
  { id: 'ins1', orderId: 'SO2026060905', engineerName: '张明辉', status: 'pass', aiScore: 96, checkDate: '2026-06-09', issues: [] },
  { id: 'ins2', orderId: 'SO2026060807', engineerName: '张明辉', status: 'pass', aiScore: 94, checkDate: '2026-06-08', issues: [] },
  { id: 'ins3', orderId: 'SO2026060903', engineerName: '李建国', status: 'pass', aiScore: 91, checkDate: '2026-06-08', issues: [] },
  { id: 'ins4', orderId: 'SO2026060901', engineerName: '王大伟', status: 'fail', aiScore: 62, checkDate: '2026-06-07', issues: ['完工照片与维修项目不匹配', '用户签字模糊不清', '缺少维修前照片'] },
  { id: 'ins5', orderId: 'SO2026060808', engineerName: '赵雪松', status: 'pass', aiScore: 88, checkDate: '2026-06-06', issues: [] },
  { id: 'ins6', orderId: 'SO2026060702', engineerName: '刘卫东', status: 'pass', aiScore: 95, checkDate: '2026-06-07', issues: [] },
  { id: 'ins7', orderId: 'SO2026060606', engineerName: '周建军', status: 'fail', aiScore: 70, checkDate: '2026-06-06', issues: ['配件与工单记录不符', '服务时长异常偏短'] },
  { id: 'ins8', orderId: 'SO2026060805', engineerName: '陈志强', status: 'pending', aiScore: 0, checkDate: '2026-06-11', issues: [] },
  { id: 'ins9', orderId: 'SO2026060705', engineerName: '孙晓峰', status: 'pending', aiScore: 0, checkDate: '2026-06-11', issues: [] },
  { id: 'ins10', orderId: 'SO2026060508', engineerName: '刘卫东', status: 'pass', aiScore: 93, checkDate: '2026-06-05', issues: [] },
]

export const liveSteps: WorkOrderStep[] = [
  { index: 1, title: '到场确认', description: '确认漏水位置和程度，关闭进水阀门', status: 'done' },
  { index: 2, title: '故障检测', description: '检测漏水原因，确认密封件损坏、内胆无腐蚀', status: 'done' },
  { index: 3, title: '维修处理', description: '更换密封件，修复管路连接，清理水垢', status: 'doing' },
  { index: 4, title: '功能测试', description: '通水通电测试，确认不再漏水且加热正常', status: 'pending' },
]

export const mockBarrageMessages = [
  '师傅手艺真好！',
  '这个配件我也换过',
  '请问这个故障一般要修多久？',
  '看得很清楚，感谢直播',
  '我家空调也是这个问题',
  '配件看起来很新',
  '维修过程很规范',
  '工程师很专业！',
  '这样操作安全吗？',
  '请问费用大概多少？',
  '上门费多少钱？',
  '质保多久啊？',
  '我也想预约这个师傅',
  '能换其他品牌的配件吗？',
  '师傅辛苦了',
]
