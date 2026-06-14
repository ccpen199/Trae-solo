import type { TraceRecord } from '@/types'

export const traceRecords: TraceRecord[] = [
  {
    traceCode: 'TR-2026-0001',
    productName: '有机西红柿',
    category: '蔬菜',
    origin: '山东省寿光市',
    batchNo: 'B-SDSG-20260501',
    blockchainHash: '0x7f3a9b2c8d1e4f6a5b7c9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
    blockHeight: 18923456,
    timestamp: '2026-05-15 08:00',
    nodes: [
      {
        id: 'N-0001-01',
        stage: 'production',
        operator: '寿光绿源种植基地',
        location: '山东省寿光市',
        timestamp: '2026-05-15 08:00',
        details: { plantingMethod: '有机种植', seedVariety: '粉太郎', greenhouseId: 'GH-A12' }
      },
      {
        id: 'N-0001-02',
        stage: 'processing',
        operator: '寿光净菜加工中心',
        location: '山东省寿光市',
        timestamp: '2026-05-18 09:30',
        details: { processType: '分拣清洗', packagingSpec: '5kg/箱', processingLine: 'PL-03' }
      },
      {
        id: 'N-0001-03',
        stage: 'logistics',
        operator: '顺丰冷链物流',
        location: '山东省寿光市→北京市',
        timestamp: '2026-05-18 14:00',
        details: { transportMode: '冷链运输', temperature: '4℃', vehicleNo: '鲁V56789' }
      },
      {
        id: 'N-0001-04',
        stage: 'wholesale',
        operator: '北京新发地农产品批发市场',
        location: '北京市丰台区',
        timestamp: '2026-05-19 06:00',
        details: { wholesalePrice: '4.8元/kg', stallNo: 'W-218' }
      },
      {
        id: 'N-0001-05',
        stage: 'retail',
        operator: '盒马鲜生朝阳店',
        location: '北京市朝阳区',
        timestamp: '2026-05-19 10:30',
        details: { retailPrice: '7.9元/kg', shelfLife: '7天' }
      }
    ],
    inspections: [
      {
        id: 'INS-0001-01',
        type: '农药残留检测',
        result: 'passed',
        reportUrl: '/reports/ins-0001-01.pdf',
        date: '2026-05-17'
      },
      {
        id: 'INS-0001-02',
        type: '重金属检测',
        result: 'passed',
        reportUrl: '/reports/ins-0001-02.pdf',
        date: '2026-05-17'
      },
      {
        id: 'INS-0001-03',
        type: '有机认证审核',
        result: 'passed',
        reportUrl: '/reports/ins-0001-03.pdf',
        date: '2026-05-16'
      }
    ]
  },
  {
    traceCode: 'TR-2026-0002',
    productName: '五常大米',
    category: '粮食',
    origin: '黑龙江省五常市',
    batchNo: 'B-HLWC-20260420',
    blockchainHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    blockHeight: 18919876,
    timestamp: '2026-04-20 07:30',
    nodes: [
      {
        id: 'N-0002-01',
        stage: 'production',
        operator: '五常稻花香种植合作社',
        location: '黑龙江省五常市',
        timestamp: '2026-04-20 07:30',
        details: { plantingMethod: '绿色种植', seedVariety: '稻花香2号', fieldId: 'F-WC-017' }
      },
      {
        id: 'N-0002-02',
        stage: 'processing',
        operator: '五常金禾米业加工厂',
        location: '黑龙江省五常市',
        timestamp: '2026-04-25 10:00',
        details: { processType: '脱壳碾磨', packagingSpec: '10kg/袋', processingLine: 'PL-Rice-01' }
      },
      {
        id: 'N-0002-03',
        stage: 'logistics',
        operator: '京东物流',
        location: '黑龙江省五常市→上海市',
        timestamp: '2026-04-26 08:00',
        details: { transportMode: '常温运输', vehicleNo: '黑A12345' }
      },
      {
        id: 'N-0002-04',
        stage: 'wholesale',
        operator: '上海江桥批发市场',
        location: '上海市嘉定区',
        timestamp: '2026-04-28 05:30',
        details: { wholesalePrice: '12.5元/kg', stallNo: 'W-045' }
      },
      {
        id: 'N-0002-05',
        stage: 'retail',
        operator: '山姆会员店上海浦东店',
        location: '上海市浦东新区',
        timestamp: '2026-04-29 09:00',
        details: { retailPrice: '18.8元/kg', shelfLife: '180天' }
      }
    ],
    inspections: [
      {
        id: 'INS-0002-01',
        type: '品质检测',
        result: 'passed',
        reportUrl: '/reports/ins-0002-01.pdf',
        date: '2026-04-24'
      },
      {
        id: 'INS-0002-02',
        type: '产地溯源认证',
        result: 'passed',
        reportUrl: '/reports/ins-0002-02.pdf',
        date: '2026-04-22'
      }
    ]
  },
  {
    traceCode: 'TR-2026-0003',
    productName: '新疆阿克苏苹果',
    category: '水果',
    origin: '新疆阿克苏地区',
    batchNo: 'B-XJAKS-20260510',
    blockchainHash: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8',
    blockHeight: 18922103,
    timestamp: '2026-05-10 09:00',
    nodes: [
      {
        id: 'N-0003-01',
        stage: 'production',
        operator: '阿克苏红旗坡农场',
        location: '新疆阿克苏市',
        timestamp: '2026-05-10 09:00',
        details: { plantingMethod: '自然生长', seedVariety: '红富士冰糖心', orchardId: 'OR-AKS-008' }
      },
      {
        id: 'N-0003-02',
        stage: 'processing',
        operator: '阿克苏果品分选中心',
        location: '新疆阿克苏市',
        timestamp: '2026-05-12 11:00',
        details: { processType: '分选包装', packagingSpec: '5kg/箱', gradingStandard: '一级果' }
      },
      {
        id: 'N-0003-03',
        stage: 'logistics',
        operator: '中通冷链',
        location: '新疆阿克苏市→广州市',
        timestamp: '2026-05-12 16:00',
        details: { transportMode: '冷链运输', temperature: '2℃', vehicleNo: '新A67890' }
      },
      {
        id: 'N-0003-04',
        stage: 'wholesale',
        operator: '广州江南果菜批发市场',
        location: '广州市白云区',
        timestamp: '2026-05-15 04:30',
        details: { wholesalePrice: '8.5元/kg', stallNo: 'W-312' }
      },
      {
        id: 'N-0003-05',
        stage: 'retail',
        operator: '百果园天河城店',
        location: '广州市天河区',
        timestamp: '2026-05-16 10:00',
        details: { retailPrice: '15.8元/kg', shelfLife: '30天' }
      }
    ],
    inspections: [
      {
        id: 'INS-0003-01',
        type: '糖度检测',
        result: 'passed',
        reportUrl: '/reports/ins-0003-01.pdf',
        date: '2026-05-11'
      },
      {
        id: 'INS-0003-02',
        type: '农药残留检测',
        result: 'passed',
        reportUrl: '/reports/ins-0003-02.pdf',
        date: '2026-05-11'
      },
      {
        id: 'INS-0003-03',
        type: '原产地地理标志认证',
        result: 'passed',
        reportUrl: '/reports/ins-0003-03.pdf',
        date: '2026-05-10'
      }
    ]
  },
  {
    traceCode: 'TR-2026-0004',
    productName: '云南普洱茶',
    category: '茶叶',
    origin: '云南省普洱市',
    batchNo: 'B-YNPE-20260315',
    blockchainHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    blockHeight: 18914567,
    timestamp: '2026-03-15 06:00',
    nodes: [
      {
        id: 'N-0004-01',
        stage: 'production',
        operator: '普洱古树茶庄园',
        location: '云南省普洱市思茅区',
        timestamp: '2026-03-15 06:00',
        details: { plantingMethod: '古树茶自然生长', teaVariety: '大叶种', mountainId: 'MT-YN-023' }
      },
      {
        id: 'N-0004-02',
        stage: 'processing',
        operator: '普洱老字号茶厂',
        location: '云南省普洱市思茅区',
        timestamp: '2026-03-18 08:00',
        details: { processType: '晒青毛茶渥堆发酵', packagingSpec: '357g/饼', fermentationDays: 45 }
      },
      {
        id: 'N-0004-03',
        stage: 'logistics',
        operator: '圆通速递',
        location: '云南省普洱市→成都市',
        timestamp: '2026-05-10 10:00',
        details: { transportMode: '常温运输', vehicleNo: '云J34567' }
      },
      {
        id: 'N-0004-04',
        stage: 'wholesale',
        operator: '成都大西南茶城',
        location: '成都市金牛区',
        timestamp: '2026-05-12 09:00',
        details: { wholesalePrice: '380元/饼', stallNo: 'W-108' }
      },
      {
        id: 'N-0004-05',
        stage: 'retail',
        operator: '竹叶青旗舰店',
        location: '成都市锦江区',
        timestamp: '2026-05-13 11:00',
        details: { retailPrice: '568元/饼', shelfLife: '长期' }
      }
    ],
    inspections: [
      {
        id: 'INS-0004-01',
        type: '茶叶质量检测',
        result: 'passed',
        reportUrl: '/reports/ins-0004-01.pdf',
        date: '2026-03-17'
      },
      {
        id: 'INS-0004-02',
        type: '有机茶认证',
        result: 'passed',
        reportUrl: '/reports/ins-0004-02.pdf',
        date: '2026-03-16'
      }
    ]
  }
]
