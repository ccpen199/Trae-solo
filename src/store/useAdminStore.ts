import { create } from 'zustand';
import type {
  Worker,
  WorkerCert,
  SopDocument,
  InsuranceProduct,
  QAAnalysis,
  QARecord,
  ServiceType,
} from '@/types';

interface AdminStats {
  totalUsers: number;
  totalWorkers: number;
  totalOrders: number;
  todayOrders: number;
  revenueToday: number;
  revenueMonth: number;
  activeWorkers: number;
  pendingAudits: number;
  orderCompletionRate: number;
  avgRating: number;
  weeklyOrders: { day: string; orders: number; revenue: number }[];
  orderTypeDistribution: { name: string; value: number; color: string }[];
}

interface AdminState {
  stats: AdminStats;
  auditQueue: (Worker & { cert: WorkerCert })[];
  sopDocuments: SopDocument[];
  insuranceProducts: InsuranceProduct[];
  qaAnalysis: QAAnalysis;
  qaRecords: QARecord[];
  setStats: (stats: AdminStats) => void;
  setAuditQueue: (queue: (Worker & { cert: WorkerCert })[]) => void;
  setSopDocuments: (docs: SopDocument[]) => void;
  setInsuranceProducts: (products: InsuranceProduct[]) => void;
  setQaAnalysis: (analysis: QAAnalysis) => void;
  setQaRecords: (records: QARecord[]) => void;
  approveWorker: (workerId: number) => void;
  rejectWorker: (workerId: number, reason: string) => void;
  addSopDocument: (doc: Omit<SopDocument, 'id' | 'updated_at'>) => void;
  updateSopDocument: (id: number, doc: Partial<SopDocument>) => void;
  deleteSopDocument: (id: number) => void;
  addInsuranceProduct: (product: Omit<InsuranceProduct, 'id'>) => void;
  updateInsuranceProduct: (id: number, product: Partial<InsuranceProduct>) => void;
  deleteInsuranceProduct: (id: number) => void;
  getSopByServiceType: (serviceType: ServiceType) => SopDocument[];
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: {
    totalUsers: 12580,
    totalWorkers: 486,
    totalOrders: 38920,
    todayOrders: 156,
    revenueToday: 32800,
    revenueMonth: 856400,
    activeWorkers: 342,
    pendingAudits: 28,
    orderCompletionRate: 97.3,
    avgRating: 4.82,
    weeklyOrders: [
      { day: '周一', orders: 142, revenue: 28500 },
      { day: '周二', orders: 158, revenue: 31200 },
      { day: '周三', orders: 135, revenue: 26800 },
      { day: '周四', orders: 168, revenue: 34500 },
      { day: '周五', orders: 189, revenue: 38900 },
      { day: '周六', orders: 245, revenue: 52300 },
      { day: '周日', orders: 212, revenue: 45600 },
    ],
    orderTypeDistribution: [
      { name: '日常保洁', value: 45, color: '#3B82F6' },
      { name: '深度保洁', value: 22, color: '#10B981' },
      { name: '育儿陪护', value: 18, color: '#F59E0B' },
      { name: '上门烹饪', value: 10, color: '#EF4444' },
      { name: '其他服务', value: 5, color: '#8B5CF6' },
    ],
  },
  auditQueue: [
    {
      id: 104,
      phone: '13700137004',
      real_name: '赵美华',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie4',
      status: 'pending',
      skills: ['日常保洁', '衣物整理'],
      age: 38,
      experience_years: 2,
      cert: {
        id: 4,
        worker_id: 104,
        id_card_url: 'https://example.com/certs/id-104.jpg',
        health_cert_url: 'https://example.com/certs/health-104.jpg',
        crime_record_url: 'https://example.com/certs/crime-104.jpg',
        ocr_result: '姓名：赵美华，身份证：110105198603155678，健康证有效期至2026-11-30，无犯罪记录',
        verify_status: 'ocr_done',
        submitted_at: '2024-06-13T10:20:00Z',
        ocr_completed_at: '2024-06-13T10:23:00Z',
        ocr_detail: {
          id_card: {
            ocr_time: '2024-06-13T10:21:00Z',
            confidence: 98.2,
            fields: [
              { label: '姓名', value: '赵美华', confidence: 99.1 },
              { label: '身份证号', value: '110105198603155678', confidence: 97.8 },
              { label: '性别', value: '女', confidence: 99.5 },
              { label: '民族', value: '汉', confidence: 98.9 },
              { label: '出生日期', value: '1986-03-15', confidence: 98.0 },
              { label: '住址', value: '北京市朝阳区建国路88号', confidence: 96.5 },
              { label: '有效期', value: '2019-05-10 至 2039-05-09', confidence: 98.5 },
              { label: '签发机关', value: '北京市公安局朝阳分局', confidence: 97.2 },
            ],
          },
          health_cert: {
            ocr_time: '2024-06-13T10:22:00Z',
            confidence: 95.6,
            fields: [
              { label: '证件名称', value: '北京市从业人员健康证', confidence: 99.0 },
              { label: '持证人', value: '赵美华', confidence: 98.2 },
              { label: '从业类型', value: '家政服务', confidence: 96.0 },
              { label: '发证机构', value: '北京市朝阳区疾控中心', confidence: 94.8 },
              { label: '发证日期', value: '2025-12-01', confidence: 96.5 },
              { label: '有效期至', value: '2026-11-30', confidence: 97.0 },
              { label: '健康状况', value: '合格', confidence: 98.5 },
            ],
          },
          crime_record: {
            ocr_time: '2024-06-13T10:23:00Z',
            confidence: 97.8,
            fields: [
              { label: '证明名称', value: '无违法犯罪记录证明', confidence: 99.2 },
              { label: '被证明人', value: '赵美华', confidence: 98.5 },
              { label: '开具单位', value: '北京市公安局朝阳分局', confidence: 97.0 },
              { label: '开具日期', value: '2025-11-15', confidence: 97.5 },
              { label: '有效期至', value: '2026-05-14', confidence: 98.0 },
              { label: '核查结果', value: '未发现违法犯罪记录', confidence: 99.5 },
            ],
          },
        },
        review_history: [
          {
            id: 1,
            reviewer: 'OCR自动识别系统',
            review_time: '2024-06-13T10:23:00Z',
            result: 'pass',
            remark: '三证OCR识别完成，平均置信度97.2%，字段完整度100%，无明显异常',
            type: 'ocr',
          },
        ],
      },
    },
    {
      id: 106,
      phone: '13700137006',
      real_name: '孙丽娟',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie6',
      status: 'pending',
      skills: ['日常保洁'],
      age: 35,
      experience_years: 1,
      cert: {
        id: 6,
        worker_id: 106,
        id_card_url: 'https://example.com/certs/id-106.jpg',
        health_cert_url: 'https://example.com/certs/health-106.jpg',
        crime_record_url: 'https://example.com/certs/crime-106.jpg',
        ocr_result: '姓名：孙丽娟，身份证：110106198907204321，健康证待复查，OCR识别置信度偏低',
        verify_status: 'pending',
        submitted_at: '2024-06-14T09:45:00Z',
        ocr_detail: {
          id_card: {
            ocr_time: '2024-06-14T09:46:00Z',
            confidence: 98.5,
            fields: [
              { label: '姓名', value: '孙丽娟', confidence: 99.2 },
              { label: '身份证号', value: '110106198907204321', confidence: 98.0 },
              { label: '性别', value: '女', confidence: 99.5 },
              { label: '出生日期', value: '1989-07-20', confidence: 98.5 },
              { label: '有效期', value: '2020-08-01 至 长期', confidence: 97.8 },
            ],
          },
          health_cert: {
            ocr_time: '2024-06-14T09:47:00Z',
            confidence: 72.3,
            fields: [
              { label: '证件名称', value: '北京市从业人员健康证', confidence: 85.0 },
              { label: '持证人', value: '孙丽娟', confidence: 78.5 },
              { label: '发证日期', value: '2024-05-15', confidence: 65.0 },
              { label: '有效期至', value: '无法识别', confidence: 42.0 },
              { label: '健康状况', value: '合格', confidence: 88.0 },
            ],
          },
          crime_record: {
            ocr_time: '2024-06-14T09:48:00Z',
            confidence: 97.0,
            fields: [
              { label: '证明名称', value: '无违法犯罪记录证明', confidence: 99.0 },
              { label: '被证明人', value: '孙丽娟', confidence: 98.2 },
              { label: '有效期至', value: '2026-04-20', confidence: 97.5 },
              { label: '核查结果', value: '未发现违法犯罪记录', confidence: 99.2 },
            ],
          },
        },
        review_history: [
          {
            id: 1,
            reviewer: 'OCR自动识别系统',
            review_time: '2024-06-14T09:48:00Z',
            result: 'pass',
            remark: '三证OCR识别完成，平均置信度89.3%，健康证有效期字段识别异常（置信度42%），建议人工复核',
            type: 'ocr',
          },
          {
            id: 2,
            reviewer: '初审专员-刘芳',
            review_time: '2024-06-14T10:15:00Z',
            result: 'reject',
            remark: '健康证照片模糊，有效期无法辨认，需重新上传清晰照片。身份证与无犯罪记录证明正常。',
            type: 'manual',
          },
        ],
      },
    },
    {
      id: 109,
      phone: '13700137009',
      real_name: '钱金凤',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie9',
      status: 'pending',
      skills: ['育儿陪护', '辅食制作'],
      age: 41,
      experience_years: 4,
      cert: {
        id: 9,
        worker_id: 109,
        id_card_url: 'https://example.com/certs/id-109.jpg',
        health_cert_url: 'https://example.com/certs/health-109.jpg',
        crime_record_url: 'https://example.com/certs/crime-109.jpg',
        ocr_result: '姓名：钱金凤，身份证：110108198312058765，健康证有效期至2026-08-20，无犯罪记录',
        verify_status: 'ocr_done',
        submitted_at: '2024-06-14T14:10:00Z',
        ocr_completed_at: '2024-06-14T14:13:00Z',
        ocr_detail: {
          id_card: {
            ocr_time: '2024-06-14T14:11:00Z',
            confidence: 99.0,
            fields: [
              { label: '姓名', value: '钱金凤', confidence: 99.5 },
              { label: '身份证号', value: '110108198312058765', confidence: 98.8 },
              { label: '性别', value: '女', confidence: 99.7 },
              { label: '民族', value: '汉', confidence: 99.0 },
              { label: '出生日期', value: '1983-12-05', confidence: 98.5 },
              { label: '住址', value: '北京市海淀区中关村大街1号', confidence: 97.8 },
              { label: '有效期', value: '2021-03-10 至 2041-03-09', confidence: 99.2 },
              { label: '签发机关', value: '北京市公安局海淀分局', confidence: 98.0 },
            ],
          },
          health_cert: {
            ocr_time: '2024-06-14T14:12:00Z',
            confidence: 96.8,
            fields: [
              { label: '证件名称', value: '北京市从业人员健康证', confidence: 99.0 },
              { label: '持证人', value: '钱金凤', confidence: 98.5 },
              { label: '从业类型', value: '母婴护理', confidence: 96.0 },
              { label: '发证机构', value: '北京市海淀区妇幼保健院', confidence: 95.5 },
              { label: '发证日期', value: '2025-08-20', confidence: 97.0 },
              { label: '有效期至', value: '2026-08-19', confidence: 98.2 },
              { label: '健康状况', value: '合格（含乙肝表面抗原阴性）', confidence: 99.0 },
            ],
          },
          crime_record: {
            ocr_time: '2024-06-14T14:13:00Z',
            confidence: 98.5,
            fields: [
              { label: '证明名称', value: '无违法犯罪记录证明', confidence: 99.0 },
              { label: '被证明人', value: '钱金凤', confidence: 98.8 },
              { label: '开具单位', value: '北京市公安局海淀分局', confidence: 97.5 },
              { label: '开具日期', value: '2025-10-01', confidence: 98.0 },
              { label: '有效期至', value: '2026-03-31', confidence: 99.1 },
              { label: '核查结果', value: '未发现违法犯罪记录', confidence: 99.8 },
            ],
          },
        },
        review_history: [
          {
            id: 1,
            reviewer: 'OCR自动识别系统',
            review_time: '2024-06-14T14:13:00Z',
            result: 'pass',
            remark: '三证OCR识别完成，平均置信度98.1%，字段完整度100%。注意：无犯罪记录证明将于2026-03-31到期，需标记后续提醒',
            type: 'ocr',
          },
        ],
      },
    },
  ],
  sopDocuments: [
    {
      id: 1,
      service_type: 'cleaning',
      service_type_label: '日常保洁',
      title: '家庭日常保洁标准作业流程',
      content: '本流程适用于家庭日常保洁服务，包含客厅、卧室、厨房、卫生间等区域的标准化清洁步骤。',
      version: 'v2.1',
      updated_at: '2024-05-20T10:00:00Z',
      steps: [
        { title: '准备工作', description: '穿戴工服、鞋套，准备清洁工具和耗材', tips: '进门先问好，说明服务内容' },
        { title: '客厅清洁', description: '整理物品、擦拭家具、清扫地面、拖洗地板', tips: '注意电子产品不要沾水' },
        { title: '卧室清洁', description: '整理床铺、擦拭表面、清扫地面', tips: '私人物品不要随意翻动' },
        { title: '厨房清洁', description: '擦拭台面、清理油污、清洁电器外部', tips: '使用专用清洁剂' },
        { title: '卫生间清洁', description: '清洁马桶、洗手台、镜面、地面', tips: '消毒到位，通风换气' },
        { title: '收尾验收', description: '整理工具、请客户验收、拍照留档', tips: '主动询问是否满意' },
      ],
    },
    {
      id: 2,
      service_type: 'babysitting',
      service_type_label: '育儿陪护',
      title: '婴幼儿陪护服务标准流程',
      content: '本流程适用于0-6岁婴幼儿陪护服务，确保服务安全、专业、规范。',
      version: 'v1.5',
      updated_at: '2024-04-15T14:30:00Z',
      steps: [
        { title: '上岗准备', description: '洗手消毒、确认孩子状态、了解特殊需求' },
        { title: '互动陪伴', description: '按年龄段进行益智游戏、阅读、户外活动' },
        { title: '生活照料', description: '协助用餐、更换尿布、哄睡休息', tips: '严格按照家长嘱咐操作' },
        { title: '安全监护', description: '全程视线不离开孩子，排查安全隐患' },
        { title: '交接反馈', description: '向家长详细反馈孩子状态，记录特殊情况' },
      ],
    },
    {
      id: 3,
      service_type: 'cooking',
      service_type_label: '上门烹饪',
      title: '家庭烹饪服务标准流程',
      content: '本流程适用于家庭上门烹饪服务，保证菜品质量和食品安全。',
      version: 'v1.2',
      updated_at: '2024-03-10T09:00:00Z',
      steps: [
        { title: '备料确认', description: '核对食材新鲜度、数量，确认菜单' },
        { title: '厨房准备', description: '清洁双手、穿戴围裙、整理操作台' },
        { title: '烹饪制作', description: '按顺序烹炒，注意火候和调味', tips: '兼顾营养和口味' },
        { title: '装盘整理', description: '美观装盘、保持操作台整洁' },
        { title: '清理收尾', description: '清洁厨具、整理厨房、请客户品尝' },
      ],
    },
  ],
  insuranceProducts: [
    {
      id: 1,
      name: '家政服务综合责任险',
      coverage: '服务过程中造成的人身伤害及财产损失',
      coverage_amount: 500000,
      premium: 3.5,
      provider: '中国平安保险',
      description: '每单必选，保障服务过程中因阿姨过失导致的第三方人身伤害和财产损失。',
    },
    {
      id: 2,
      name: '家政人员意外险',
      coverage: '阿姨服务期间的意外伤害及医疗',
      coverage_amount: 200000,
      premium: 2.0,
      provider: '中国人寿保险',
      description: '保障阿姨在服务过程中遭受的意外伤害、意外医疗费用。',
    },
    {
      id: 3,
      name: '贵重物品专项保障',
      coverage: '服务中造成的贵重物品损坏或丢失',
      coverage_amount: 100000,
      premium: 5.0,
      provider: '太平洋保险',
      description: '针对家中贵重物品（如珠宝、古董、电子产品等）的专项保障。',
    },
    {
      id: 4,
      name: '延误保障险',
      coverage: '阿姨服务超时或爽约赔付',
      coverage_amount: 200,
      premium: 1.0,
      provider: '泰康在线',
      description: '阿姨迟到超过30分钟或爽约，按订单金额比例赔付。',
    },
  ],
  qaAnalysis: {
    totalReviews: 2856,
    averageRating: 4.82,
    negativeReviews: 58,
    positiveReviews: 2798,
    rootCauses: [
      { name: '服务态度', value: 18, color: '#EF4444' },
      { name: '清洁质量', value: 25, color: '#F59E0B' },
      { name: '迟到早退', value: 12, color: '#10B981' },
      { name: '物品损坏', value: 8, color: '#3B82F6' },
      { name: '沟通不畅', value: 15, color: '#8B5CF6' },
      { name: '其他原因', value: 22, color: '#6B7280' },
    ],
    keywordCloud: [
      { text: '干净', value: 1892 },
      { text: '准时', value: 1654 },
      { text: '态度好', value: 1523 },
      { text: '专业', value: 1345 },
      { text: '细心', value: 1234 },
      { text: '满意', value: 1189 },
      { text: '推荐', value: 987 },
      { text: '下次还约', value: 876 },
      { text: '速度快', value: 765 },
      { text: '沟通好', value: 654 },
    ],
    monthlyTrend: [
      { month: '1月', positive: 320, negative: 12 },
      { month: '2月', positive: 298, negative: 8 },
      { month: '3月', positive: 385, negative: 15 },
      { month: '4月', positive: 412, negative: 10 },
      { month: '5月', positive: 456, negative: 7 },
      { month: '6月', positive: 498, negative: 6 },
    ],
  },
  qaRecords: [
    {
      id: 1,
      order_id: 998,
      audio_url: 'https://example.com/qa/audio-998.mp3',
      transcript_text: '客户反馈厨房角落没有擦干净，阿姨解释说因为客户临时加了擦玻璃项目，时间不够用...',
      keywords: ['清洁质量', '厨房', '时间不够'],
      root_cause: '服务项目临时增加导致时间分配不足',
      root_cause_category: '清洁质量',
      rating: 3,
      created_at: '2024-06-13T16:30:00Z',
    },
    {
      id: 2,
      order_id: 985,
      audio_url: 'https://example.com/qa/audio-985.mp3',
      transcript_text: '客户称阿姨迟到了40分钟，阿姨解释地铁故障...',
      keywords: ['迟到', '地铁', '交通'],
      root_cause: '交通不可抗力导致迟到',
      root_cause_category: '迟到早退',
      rating: 2,
      created_at: '2024-06-12T11:20:00Z',
    },
  ],
  setStats: (stats) => set({ stats }),
  setAuditQueue: (auditQueue) => set({ auditQueue }),
  setSopDocuments: (sopDocuments) => set({ sopDocuments }),
  setInsuranceProducts: (insuranceProducts) => set({ insuranceProducts }),
  setQaAnalysis: (qaAnalysis) => set({ qaAnalysis }),
  setQaRecords: (qaRecords) => set({ qaRecords }),
  approveWorker: (workerId) =>
    set((state) => ({
      auditQueue: state.auditQueue.filter((w) => w.id !== workerId),
      stats: {
        ...state.stats,
        totalWorkers: state.stats.totalWorkers + 1,
        pendingAudits: state.stats.pendingAudits - 1,
      },
    })),
  rejectWorker: (workerId) =>
    set((state) => ({
      auditQueue: state.auditQueue.filter((w) => w.id !== workerId),
      stats: {
        ...state.stats,
        pendingAudits: state.stats.pendingAudits - 1,
      },
    })),
  addSopDocument: (doc) =>
    set((state) => ({
      sopDocuments: [
        ...state.sopDocuments,
        { ...doc, id: Date.now(), updated_at: new Date().toISOString() },
      ],
    })),
  updateSopDocument: (id, doc) =>
    set((state) => ({
      sopDocuments: state.sopDocuments.map((d) =>
        d.id === id ? { ...d, ...doc, updated_at: new Date().toISOString() } : d
      ),
    })),
  deleteSopDocument: (id) =>
    set((state) => ({
      sopDocuments: state.sopDocuments.filter((d) => d.id !== id),
    })),
  addInsuranceProduct: (product) =>
    set((state) => ({
      insuranceProducts: [...state.insuranceProducts, { ...product, id: Date.now() }],
    })),
  updateInsuranceProduct: (id, product) =>
    set((state) => ({
      insuranceProducts: state.insuranceProducts.map((p) =>
        p.id === id ? { ...p, ...product } : p
      ),
    })),
  deleteInsuranceProduct: (id) =>
    set((state) => ({
      insuranceProducts: state.insuranceProducts.filter((p) => p.id !== id),
    })),
  getSopByServiceType: (serviceType) =>
    get().sopDocuments.filter((d) => d.service_type === serviceType),
}));
