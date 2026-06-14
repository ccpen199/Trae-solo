export const traceRecords = [
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

export const farmPlots = [
  {
    id: 'FP-001',
    name: '五常稻田一号',
    area: 120,
    soilType: '黑土',
    crop: '水稻',
    location: { lat: 44.9087, lng: 127.1567 },
    records: [
      {
        date: '2026-03-20',
        type: 'sowing',
        description: '稻花香2号种子浸种催芽后播种',
        inputs: [{ name: '稻花香2号种子', amount: '5kg' }]
      },
      {
        date: '2026-04-05',
        type: 'fertilizing',
        description: '施底肥有机肥促进分蘖',
        inputs: [{ name: '有机复合肥', amount: '200kg' }, { name: '硅肥', amount: '30kg' }]
      },
      {
        date: '2026-04-20',
        type: 'irrigating',
        description: '插秧后浅水灌溉保持水位3cm'
      },
      {
        date: '2026-05-15',
        type: 'spraying',
        description: '生物农药防治稻瘟病',
        inputs: [{ name: '枯草芽孢杆菌', amount: '500ml' }]
      },
      {
        date: '2026-06-10',
        type: 'fertilizing',
        description: '追施穗肥促进籽粒饱满',
        inputs: [{ name: '尿素', amount: '50kg' }, { name: '钾肥', amount: '40kg' }]
      },
      {
        date: '2026-07-01',
        type: 'irrigating',
        description: '抽穗期深水灌溉保持水位5cm'
      },
      {
        date: '2026-08-15',
        type: 'spraying',
        description: '防治稻飞虱喷施生物制剂',
        inputs: [{ name: '吡蚜酮', amount: '300ml' }]
      },
      {
        date: '2026-09-25',
        type: 'harvesting',
        description: '机械收割晾晒入库'
      }
    ]
  },
  {
    id: 'FP-002',
    name: '寿光温室三号',
    area: 8,
    soilType: '壤土',
    crop: '西红柿',
    location: { lat: 36.8551, lng: 118.7337 },
    records: [
      {
        date: '2026-02-10',
        type: 'sowing',
        description: '粉太郎品种穴盘育苗播种',
        inputs: [{ name: '粉太郎种子', amount: '2000粒' }]
      },
      {
        date: '2026-03-01',
        type: 'fertilizing',
        description: '定植前施基肥改良土壤',
        inputs: [{ name: '腐熟有机肥', amount: '500kg' }, { name: '过磷酸钙', amount: '20kg' }]
      },
      {
        date: '2026-03-15',
        type: 'irrigating',
        description: '滴灌系统安装调试完成开始灌溉'
      },
      {
        date: '2026-04-10',
        type: 'spraying',
        description: '防治早疫病喷施生物农药',
        inputs: [{ name: '多抗霉素', amount: '200ml' }]
      },
      {
        date: '2026-05-01',
        type: 'fertilizing',
        description: '追施膨果肥促进果实生长',
        inputs: [{ name: '水溶肥', amount: '15kg' }]
      },
      {
        date: '2026-05-20',
        type: 'harvesting',
        description: '第一批果实成熟人工采摘'
      },
      {
        date: '2026-06-05',
        type: 'spraying',
        description: '防治白粉虱喷施药剂',
        inputs: [{ name: '噻虫嗪', amount: '150ml' }]
      }
    ]
  },
  {
    id: 'FP-003',
    name: '阿克苏果园七号',
    area: 50,
    soilType: '沙壤土',
    crop: '苹果',
    location: { lat: 41.1677, lng: 80.2613 },
    records: [
      {
        date: '2026-03-10',
        type: 'fertilizing',
        description: '春季追肥促进萌芽',
        inputs: [{ name: '有机肥', amount: '1000kg' }, { name: '氮磷钾复合肥', amount: '100kg' }]
      },
      {
        date: '2026-04-01',
        type: 'spraying',
        description: '花前喷施石硫合剂清园',
        inputs: [{ name: '石硫合剂', amount: '50L' }]
      },
      {
        date: '2026-04-20',
        type: 'irrigating',
        description: '花期灌溉保证水分供应'
      },
      {
        date: '2026-05-15',
        type: 'spraying',
        description: '幼果期防治食心虫',
        inputs: [{ name: '高效氯氟氰菊酯', amount: '300ml' }, { name: '钙肥', amount: '10kg' }]
      },
      {
        date: '2026-06-10',
        type: 'fertilizing',
        description: '果实膨大期追肥',
        inputs: [{ name: '钾肥', amount: '80kg' }, { name: '有机液肥', amount: '200L' }]
      },
      {
        date: '2026-07-05',
        type: 'irrigating',
        description: '夏季高温期增加灌溉频次'
      },
      {
        date: '2026-08-20',
        type: 'spraying',
        description: '采收前病虫害防治',
        inputs: [{ name: '生物农药', amount: '400ml' }]
      },
      {
        date: '2026-10-10',
        type: 'harvesting',
        description: '冰糖心苹果成熟分批采摘'
      }
    ]
  }
]

export const supplyDemandItems = [
  {
    id: 'SD-001',
    type: 'supply',
    category: '蔬菜',
    productName: '有机西红柿',
    specification: '一级果 5kg/箱',
    quantity: '2000kg',
    price: 5.6,
    region: '山东省寿光市',
    publisher: '寿光绿源种植基地',
    publishDate: '2026-05-18',
    matchScore: 92
  },
  {
    id: 'SD-002',
    type: 'demand',
    category: '蔬菜',
    productName: '有机西红柿',
    specification: '一级果 5kg/箱',
    quantity: '500kg',
    price: 6.0,
    region: '北京市朝阳区',
    publisher: '盒马鲜生采购部',
    publishDate: '2026-05-19',
    matchScore: 92
  },
  {
    id: 'SD-003',
    type: 'supply',
    category: '粮食',
    productName: '五常大米',
    specification: '稻花香2号 10kg/袋',
    quantity: '5000kg',
    price: 14.5,
    region: '黑龙江省五常市',
    publisher: '五常金禾米业',
    publishDate: '2026-04-28',
    matchScore: 88
  },
  {
    id: 'SD-004',
    type: 'demand',
    category: '水果',
    productName: '红富士苹果',
    specification: '80mm以上 一级果',
    quantity: '3000kg',
    price: 9.0,
    region: '上海市浦东新区',
    publisher: '百果园上海总部',
    publishDate: '2026-05-20',
    matchScore: 85
  },
  {
    id: 'SD-005',
    type: 'supply',
    category: '水果',
    productName: '新疆阿克苏苹果',
    specification: '冰糖心 5kg/箱',
    quantity: '8000kg',
    price: 8.5,
    region: '新疆阿克苏市',
    publisher: '阿克苏红旗坡农场',
    publishDate: '2026-05-15',
    matchScore: 85
  },
  {
    id: 'SD-006',
    type: 'demand',
    category: '畜牧',
    productName: '散养土鸡蛋',
    specification: '30枚/盒',
    quantity: '10000盒',
    price: 2.5,
    region: '广东省深圳市',
    publisher: '永辉超市深圳采购中心',
    publishDate: '2026-05-22',
    matchScore: 78
  },
  {
    id: 'SD-007',
    type: 'supply',
    category: '水产',
    productName: '阳澄湖大闸蟹',
    specification: '4两公蟹 3两母蟹',
    quantity: '2000kg',
    price: 180,
    region: '江苏省苏州市',
    publisher: '阳澄湖蟹王水产',
    publishDate: '2026-05-10',
    matchScore: 71
  },
  {
    id: 'SD-008',
    type: 'supply',
    category: '茶叶',
    productName: '云南普洱茶饼',
    specification: '357g/饼 2026年春茶',
    quantity: '500饼',
    price: 380,
    region: '云南省普洱市',
    publisher: '普洱古树茶庄园',
    publishDate: '2026-05-12',
    matchScore: 65
  },
  {
    id: 'SD-009',
    type: 'demand',
    category: '粮食',
    productName: '东北黄豆',
    specification: '非转基因 一级',
    quantity: '10000kg',
    price: 6.8,
    region: '辽宁省大连市',
    publisher: '大连粮油贸易公司',
    publishDate: '2026-05-25',
    matchScore: 60
  }
]

export const shops = [
  {
    id: 'SHOP-001',
    name: '绿源有机农场',
    logo: '',
    description: '专注有机蔬菜种植与销售，拥有自建温室大棚50座，通过国家有机认证，从田间到餐桌全程可溯源',
    rating: 4.8,
    deposit: 50000,
    products: [
      {
        id: 'P-001-01',
        name: '有机西红柿',
        category: '蔬菜',
        price: 7.9,
        stock: 2000,
        traceCode: 'TR-2026-0001',
        images: ['']
      },
      {
        id: 'P-001-02',
        name: '有机黄瓜',
        category: '蔬菜',
        price: 5.5,
        stock: 1500,
        traceCode: 'TR-2026-0005',
        images: ['']
      },
      {
        id: 'P-001-03',
        name: '有机青椒',
        category: '蔬菜',
        price: 6.8,
        stock: 800,
        traceCode: 'TR-2026-0006',
        images: ['']
      }
    ]
  },
  {
    id: 'SHOP-002',
    name: '金秋粮油行',
    logo: '',
    description: '经营东北优质粮油产品二十年，主营五常大米、非转基因大豆油等，源头直供品质保证',
    rating: 4.6,
    deposit: 80000,
    products: [
      {
        id: 'P-002-01',
        name: '五常大米',
        category: '粮食',
        price: 18.8,
        stock: 5000,
        traceCode: 'TR-2026-0002',
        images: ['']
      },
      {
        id: 'P-002-02',
        name: '非转基因大豆油',
        category: '粮油',
        price: 68.0,
        stock: 3000,
        traceCode: 'TR-2026-0007',
        images: ['']
      },
      {
        id: 'P-002-03',
        name: '东北小米',
        category: '粮食',
        price: 12.5,
        stock: 2000,
        traceCode: 'TR-2026-0008',
        images: ['']
      },
      {
        id: 'P-002-04',
        name: '有机玉米面',
        category: '粮食',
        price: 8.9,
        stock: 4000,
        traceCode: 'TR-2026-0009',
        images: ['']
      }
    ]
  },
  {
    id: 'SHOP-003',
    name: '鲜达果蔬',
    logo: '',
    description: '全国名优水果产地直供，冷链配送保证新鲜，覆盖新疆、山东、云南等核心产区',
    rating: 4.7,
    deposit: 60000,
    products: [
      {
        id: 'P-003-01',
        name: '新疆阿克苏苹果',
        category: '水果',
        price: 15.8,
        stock: 6000,
        traceCode: 'TR-2026-0003',
        images: ['']
      },
      {
        id: 'P-003-02',
        name: '云南普洱茶',
        category: '茶叶',
        price: 568.0,
        stock: 200,
        traceCode: 'TR-2026-0004',
        images: ['']
      }
    ]
  }
]

export const contracts = [
  {
    id: 'CT-001',
    title: '2026年度有机西红柿供销合同',
    parties: ['寿光绿源种植基地', '盒马鲜生采购部'],
    status: 'fulfilling',
    amount: 288000,
    createDate: '2026-03-01',
    signDate: '2026-03-05',
    terms: [
      '供方每月提供有机西红柿不低于5000kg',
      '产品质量需符合国家有机标准',
      '交货地点为需方指定物流中心',
      '价格按季度协商调整',
      '违约金为合同金额的10%'
    ]
  },
  {
    id: 'CT-002',
    title: '五常大米年度采购协议',
    parties: ['五常金禾米业', '山姆会员店中国总部'],
    status: 'signed',
    amount: 1500000,
    createDate: '2026-04-10',
    signDate: '2026-04-15',
    terms: [
      '供方年度供应五常大米不低于100吨',
      '需提供原产地地理标志认证',
      '每批次须附带溯源码及检测报告',
      '付款方式为月结30天',
      '质量异议期为到货后7个工作日'
    ]
  },
  {
    id: 'CT-003',
    title: '阿克苏苹果冷链运输服务合同',
    parties: ['阿克苏红旗坡农场', '中通冷链物流'],
    status: 'completed',
    amount: 420000,
    createDate: '2026-01-15',
    signDate: '2026-01-20',
    terms: [
      '全程冷链运输温度控制在0-4℃',
      '运输时效不超过72小时',
      '货损率不超过2%',
      '每车次提供温控数据报告',
      '超温导致的货损由承运方全额赔偿'
    ]
  },
  {
    id: 'CT-004',
    title: '普洱茶经销授权合同',
    parties: ['普洱古树茶庄园', '竹叶青旗舰店'],
    status: 'disputed',
    amount: 680000,
    createDate: '2026-02-01',
    signDate: '2026-02-10',
    terms: [
      '供方授权需方为成都区域独家经销商',
      '年度最低采购量200饼',
      '供方提供品牌授权及溯源背书',
      '需方不得跨区域销售',
      '合同期限为两年'
    ]
  },
  {
    id: 'CT-005',
    title: '阳澄湖大闸蟹电商供货合同',
    parties: ['阳澄湖蟹王水产', '京东生鲜事业部'],
    status: 'draft',
    amount: 960000,
    createDate: '2026-05-28',
    terms: [
      '供方按需方订单量供货',
      '每批次附防伪溯源标识',
      '死蟹包赔',
      '价格随行就市浮动不超过10%',
      '冷链配送全程温控'
    ]
  }
]

export const qaTickets = [
  {
    id: 'QA-001',
    title: '西红柿叶片出现黄斑如何处理',
    description: '大棚种植的有机西红柿近一周内叶片陆续出现黄褐色斑点，边缘发黄，部分叶片干枯卷曲，不知是否为病害，请专家诊断并给出防治建议',
    images: [''],
    status: 'closed',
    category: '蔬菜',
    asker: '寿光绿源种植基地-李师傅',
    expert: '山东省农科院-张教授',
    answer: '根据描述和图片判断为番茄早疫病，建议：1.及时摘除病叶并销毁；2.喷施多抗霉素或百菌清进行防治；3.加强通风降低棚内湿度；4.避免大水漫灌，采用滴灌方式；5.合理密植保持通风透光',
    createDate: '2026-04-10',
    answerDate: '2026-04-11',
    rating: 5
  },
  {
    id: 'QA-002',
    title: '五常大米存储条件咨询',
    description: '今年新收的稻花香2号大米，大约5吨，请问最佳的储存条件和保质期是多长？需要什么样的仓储设施？',
    status: 'answered',
    category: '粮食',
    asker: '五常金禾米业-王经理',
    expert: '国家粮食储备研究院-刘研究员',
    answer: '稻花香2号大米的储存建议：1.储存温度控制在15℃以下，相对湿度65%以下；2.使用恒温恒湿仓库，避免阳光直射；3.真空包装可保存12-18个月，普通编织袋包装建议6个月内销售；4.定期检测水分含量不超过14.5%；5.注意防虫防鼠',
    createDate: '2026-05-20',
    answerDate: '2026-05-21',
    rating: 4
  },
  {
    id: 'QA-003',
    title: '苹果树坐果率低如何改善',
    description: '今年阿克苏果园的苹果树花期正常但坐果率明显偏低，去年同期的坐果率在60%左右，今年只有35%，请问可能是什么原因？应该如何改善？',
    images: [''],
    status: 'assigned',
    category: '水果',
    asker: '阿克苏红旗坡农场-马场长',
    expert: '新疆农业大学-陈教授',
    createDate: '2026-05-25'
  },
  {
    id: 'QA-004',
    title: '普洱茶发酵工艺疑问',
    description: '我们今年春茶渥堆发酵过程中发现堆温上不去，一直维持在40℃左右，正常应该能达到55℃以上，请问可能是什么原因？是否需要调整工艺参数？',
    status: 'pending',
    category: '茶叶',
    asker: '普洱古树茶庄园-赵师傅',
    createDate: '2026-05-28'
  }
]

export const weatherAlerts = [
  {
    id: 'WA-001',
    level: 'red',
    type: '暴雨',
    region: '山东省寿光市',
    description: '预计未来6小时内寿光市将出现特大暴雨，累计降水量可达150mm以上，并伴有雷电和8级以上大风',
    startTime: '2026-06-08 14:00',
    endTime: '2026-06-09 08:00',
    advice: '请各温室大棚做好加固防风措施，疏通排水沟渠，已成熟蔬菜尽快抢收，低洼地带注意防涝，暂停户外农事作业'
  },
  {
    id: 'WA-002',
    level: 'orange',
    type: '高温',
    region: '新疆阿克苏地区',
    description: '预计未来三天阿克苏地区日最高气温将达到40℃以上，地表温度可能超过60℃',
    startTime: '2026-06-10 10:00',
    endTime: '2026-06-13 20:00',
    advice: '果园加强灌溉补水，果实套袋防止日灼，适当遮阴降温，采摘作业避开中午高温时段，注意防暑降温'
  },
  {
    id: 'WA-003',
    level: 'yellow',
    type: '霜冻',
    region: '黑龙江省五常市',
    description: '预计5月中旬夜间最低气温将降至-2℃，可能出现晚霜冻害，对水稻秧苗和早播作物有影响',
    startTime: '2026-05-15 22:00',
    endTime: '2026-05-16 08:00',
    advice: '水稻秧苗及时覆膜保温，旱田作物可采取熏烟防霜措施，暂停移栽作业，已移栽幼苗加强保温防护'
  },
  {
    id: 'WA-004',
    level: 'blue',
    type: '大风',
    region: '云南省普洱市',
    description: '预计未来24小时内普洱市将出现6-7级大风，局部地区阵风可达8级',
    startTime: '2026-06-10 16:00',
    endTime: '2026-06-11 16:00',
    advice: '茶园注意加固防护设施，采摘作业注意安全，制茶车间关好门窗防止粉尘污染，室外晾晒茶叶及时收回'
  }
]

export const supervisionData = {
  totalBatches: 156832,
  tracedBatches: 142315,
  traceRate: 90.7,
  passRate: 96.3,
  violationRate: 1.2,
  categoryStats: [
    { category: '蔬菜', count: 45280, passRate: 97.1 },
    { category: '水果', count: 38650, passRate: 96.8 },
    { category: '粮食', count: 32100, passRate: 98.2 },
    { category: '畜牧', count: 22430, passRate: 94.5 },
    { category: '水产', count: 18372, passRate: 93.7 },
    { category: '茶叶', count: 8650, passRate: 97.5 }
  ],
  regionStats: [
    { region: '山东省', count: 28500, passRate: 97.2 },
    { region: '黑龙江省', count: 22300, passRate: 98.0 },
    { region: '新疆维吾尔自治区', count: 19800, passRate: 96.5 },
    { region: '云南省', count: 15600, passRate: 95.8 },
    { region: '四川省', count: 14200, passRate: 96.1 },
    { region: '广东省', count: 12800, passRate: 94.3 },
    { region: '江苏省', count: 11500, passRate: 97.0 },
    { region: '河南省', count: 10800, passRate: 95.5 }
  ],
  trendData: [
    { month: '2025-07', passRate: 94.2, violationCount: 186 },
    { month: '2025-08', passRate: 94.5, violationCount: 172 },
    { month: '2025-09', passRate: 95.0, violationCount: 158 },
    { month: '2025-10', passRate: 95.3, violationCount: 145 },
    { month: '2025-11', passRate: 95.8, violationCount: 132 },
    { month: '2025-12', passRate: 96.0, violationCount: 125 },
    { month: '2026-01', passRate: 96.1, violationCount: 118 },
    { month: '2026-02', passRate: 96.0, violationCount: 122 },
    { month: '2026-03', passRate: 96.2, violationCount: 115 },
    { month: '2026-04', passRate: 96.3, violationCount: 108 },
    { month: '2026-05', passRate: 96.5, violationCount: 98 },
    { month: '2026-06', passRate: 96.3, violationCount: 105 }
  ]
}

export const processRecords = [
  {
    id: 'PR-001',
    batchNo: 'B-SDSG-20260501',
    productName: '有机西红柿',
    sourceBatch: 'SB-SDSG-20260501',
    steps: [
      {
        id: 'PS-001-01',
        name: '原料接收',
        description: '接收寿光绿源种植基地有机西红柿原料，核验溯源码和检测报告',
        timestamp: '2026-05-18 08:00',
        operator: '王建国',
        completed: true
      },
      {
        id: 'PS-001-02',
        name: '分拣清洗',
        description: '按大小色泽分级分拣，纯净水清洗去除表面杂质',
        timestamp: '2026-05-18 09:00',
        operator: '李秀芬',
        completed: true
      },
      {
        id: 'PS-001-03',
        name: '包装封箱',
        description: '5kg规格气调包装封箱，贴溯源标签和批次码',
        timestamp: '2026-05-18 09:30',
        operator: '赵明辉',
        completed: true
      },
      {
        id: 'PS-001-04',
        name: '冷库预冷',
        description: '成品入冷库预冷至4℃，等待装车发运',
        timestamp: '2026-05-18 11:00',
        operator: '孙志强',
        completed: true
      }
    ],
    qualityChecks: [
      {
        id: 'QC-001-01',
        type: '外观检测',
        result: 'passed',
        inspector: '质检员-刘芳',
        date: '2026-05-18 09:15',
        notes: '果形完整色泽均匀无机械损伤'
      },
      {
        id: 'QC-001-02',
        type: '农残快检',
        result: 'passed',
        inspector: '质检员-刘芳',
        date: '2026-05-18 09:20',
        notes: '有机磷和氨基甲酸酯类农残均未检出'
      },
      {
        id: 'QC-001-03',
        type: '包装检验',
        result: 'passed',
        inspector: '质检员-周敏',
        date: '2026-05-18 10:00',
        notes: '包装密封完好标签信息完整'
      }
    ],
    outputBatch: 'OB-SDSG-20260518',
    status: 'completed'
  },
  {
    id: 'PR-002',
    batchNo: 'B-HLWC-20260420',
    productName: '五常大米',
    sourceBatch: 'SB-HLWC-20260420',
    steps: [
      {
        id: 'PS-002-01',
        name: '稻谷接收',
        description: '接收五常稻花香种植合作社稻谷原料，核验产地证明和品质报告',
        timestamp: '2026-04-22 08:30',
        operator: '张国庆',
        completed: true
      },
      {
        id: 'PS-002-02',
        name: '脱壳碾磨',
        description: '砻谷机脱壳后经碾米机碾白加工',
        timestamp: '2026-04-23 09:00',
        operator: '刘海波',
        completed: true
      },
      {
        id: 'PS-002-03',
        name: '色选抛光',
        description: '光电色选机剔除异色粒，抛光机抛光提升米粒光泽',
        timestamp: '2026-04-24 10:00',
        operator: '陈伟东',
        completed: true
      },
      {
        id: 'PS-002-04',
        name: '真空包装',
        description: '10kg规格真空包装，贴溯源码和批次标签',
        timestamp: '2026-04-25 08:00',
        operator: '王丽华',
        completed: true
      }
    ],
    qualityChecks: [
      {
        id: 'QC-002-01',
        type: '品质检测',
        result: 'passed',
        inspector: '质检员-赵红',
        date: '2026-04-24',
        notes: '直链淀粉含量15.2%胶稠度82mm食味值87均达标'
      },
      {
        id: 'QC-002-02',
        type: '重金属检测',
        result: 'pending',
        inspector: '质检员-赵红',
        date: '2026-04-25',
        notes: '已送检等待结果'
      }
    ],
    outputBatch: 'OB-HLWC-20260425',
    status: 'quality_check'
  },
  {
    id: 'PR-003',
    batchNo: 'B-YNPE-20260315',
    productName: '云南普洱茶',
    sourceBatch: 'SB-YNPE-20260315',
    steps: [
      {
        id: 'PS-003-01',
        name: '鲜叶接收',
        description: '接收普洱古树茶庄园大叶种春茶鲜叶，核验采摘记录',
        timestamp: '2026-03-15 14:00',
        operator: '周文华',
        completed: true
      },
      {
        id: 'PS-003-02',
        name: '杀青揉捻',
        description: '铁锅手工杀青后揉捻成型',
        timestamp: '2026-03-15 16:00',
        operator: '制茶师-杨师傅',
        completed: true
      },
      {
        id: 'PS-003-03',
        name: '晒青渥堆',
        description: '日光晒青后渥堆发酵45天',
        timestamp: '2026-03-18 08:00',
        operator: '制茶师-杨师傅',
        completed: false
      },
      {
        id: 'PS-003-04',
        name: '压饼干燥',
        description: '蒸软后石磨压饼定型，自然晾干',
        timestamp: '',
        operator: '制茶师-杨师傅',
        completed: false
      }
    ],
    qualityChecks: [
      {
        id: 'QC-003-01',
        type: '鲜叶检测',
        result: 'passed',
        inspector: '质检员-李静',
        date: '2026-03-15',
        notes: '鲜叶完整度好无病虫害农残未检出'
      },
      {
        id: 'QC-003-02',
        type: '成品检测',
        result: 'pending',
        inspector: '质检员-李静',
        date: '',
        notes: '发酵未完成待检'
      }
    ],
    outputBatch: 'OB-YNPE-PENDING',
    status: 'processing'
  }
]

export const logisticsOrders = [
  {
    id: 'LO-001',
    batchNo: 'B-SDSG-20260501',
    productName: '有机西红柿',
    origin: '山东省寿光市',
    destination: '北京市丰台区',
    status: 'delivered',
    carrier: '顺丰冷链物流',
    vehicleNo: '鲁V56789',
    startTime: '2026-05-18 14:00',
    estimatedArrival: '2026-05-19 06:00',
    currentLocation: { lat: 39.8585, lng: 116.2871, address: '北京市丰台区新发地市场' },
    route: [
      { lat: 36.8551, lng: 118.7337 },
      { lat: 37.2511, lng: 117.9467 },
      { lat: 37.8756, lng: 117.0287 },
      { lat: 38.6538, lng: 116.3278 },
      { lat: 39.1548, lng: 116.6828 },
      { lat: 39.8585, lng: 116.2871 }
    ],
    tempData: [
      { time: '2026-05-18 14:00', temp: 4.2, humidity: 85 },
      { time: '2026-05-18 15:00', temp: 4.0, humidity: 86 },
      { time: '2026-05-18 16:00', temp: 3.8, humidity: 87 },
      { time: '2026-05-18 17:00', temp: 4.1, humidity: 85 },
      { time: '2026-05-18 18:00', temp: 4.3, humidity: 84 },
      { time: '2026-05-18 19:00', temp: 4.5, humidity: 83 },
      { time: '2026-05-18 20:00', temp: 4.0, humidity: 86 },
      { time: '2026-05-18 21:00', temp: 3.9, humidity: 87 },
      { time: '2026-05-18 22:00', temp: 4.2, humidity: 85 },
      { time: '2026-05-18 23:00', temp: 4.1, humidity: 86 },
      { time: '2026-05-19 00:00', temp: 3.8, humidity: 88 },
      { time: '2026-05-19 01:00', temp: 3.7, humidity: 89 }
    ],
    alerts: []
  },
  {
    id: 'LO-002',
    batchNo: 'B-XJAKS-20260510',
    productName: '新疆阿克苏苹果',
    origin: '新疆阿克苏市',
    destination: '广州市白云区',
    status: 'in_transit',
    carrier: '中通冷链',
    vehicleNo: '新A67890',
    startTime: '2026-05-12 16:00',
    estimatedArrival: '2026-05-15 12:00',
    currentLocation: { lat: 31.2304, lng: 107.8533, address: '甘肃省陇南市武都区' },
    route: [
      { lat: 41.1677, lng: 80.2613 },
      { lat: 39.4702, lng: 76.0883 },
      { lat: 38.0235, lng: 82.9686 },
      { lat: 36.0611, lng: 89.8383 },
      { lat: 34.3256, lng: 97.5683 },
      { lat: 33.2936, lng: 101.8764 },
      { lat: 31.2304, lng: 107.8533 }
    ],
    tempData: [
      { time: '2026-05-12 16:00', temp: 2.1, humidity: 78 },
      { time: '2026-05-12 18:00', temp: 2.3, humidity: 77 },
      { time: '2026-05-12 20:00', temp: 2.0, humidity: 79 },
      { time: '2026-05-12 22:00', temp: 1.8, humidity: 80 },
      { time: '2026-05-13 00:00', temp: 2.2, humidity: 78 },
      { time: '2026-05-13 02:00', temp: 2.5, humidity: 76 },
      { time: '2026-05-13 04:00', temp: 5.8, humidity: 72 },
      { time: '2026-05-13 06:00', temp: 4.2, humidity: 74 },
      { time: '2026-05-13 08:00', temp: 2.8, humidity: 77 },
      { time: '2026-05-13 10:00', temp: 2.4, humidity: 78 },
      { time: '2026-05-13 12:00', temp: 2.1, humidity: 79 },
      { time: '2026-05-13 14:00', temp: 2.3, humidity: 78 }
    ],
    alerts: [
      {
        id: 'LA-002-01',
        type: 'temp_high',
        message: '车厢温度短暂升高至5.8℃，已超过4℃上限',
        timestamp: '2026-05-13 04:00',
        resolved: true
      }
    ]
  },
  {
    id: 'LO-003',
    batchNo: 'B-HLWC-20260420',
    productName: '五常大米',
    origin: '黑龙江省五常市',
    destination: '上海市嘉定区',
    status: 'in_transit',
    carrier: '京东物流',
    vehicleNo: '黑A12345',
    startTime: '2026-04-26 08:00',
    estimatedArrival: '2026-04-28 08:00',
    currentLocation: { lat: 35.4158, lng: 117.3228, address: '山东省济宁市任城区' },
    route: [
      { lat: 44.9087, lng: 127.1567 },
      { lat: 43.8868, lng: 125.3245 },
      { lat: 42.8912, lng: 123.4567 },
      { lat: 41.1234, lng: 121.6789 },
      { lat: 39.5678, lng: 119.2345 },
      { lat: 37.8901, lng: 117.5678 },
      { lat: 35.4158, lng: 117.3228 }
    ],
    tempData: [
      { time: '2026-04-26 08:00', temp: 18.5, humidity: 55 },
      { time: '2026-04-26 10:00', temp: 19.2, humidity: 53 },
      { time: '2026-04-26 12:00', temp: 21.0, humidity: 50 },
      { time: '2026-04-26 14:00', temp: 22.5, humidity: 48 },
      { time: '2026-04-26 16:00', temp: 20.8, humidity: 52 },
      { time: '2026-04-26 18:00', temp: 19.5, humidity: 54 },
      { time: '2026-04-26 20:00', temp: 18.0, humidity: 56 },
      { time: '2026-04-26 22:00', temp: 17.2, humidity: 58 },
      { time: '2026-04-27 00:00', temp: 16.8, humidity: 60 },
      { time: '2026-04-27 02:00', temp: 16.5, humidity: 61 },
      { time: '2026-04-27 04:00', temp: 17.0, humidity: 59 },
      { time: '2026-04-27 06:00', temp: 18.3, humidity: 56 }
    ],
    alerts: [
      {
        id: 'LA-003-01',
        type: 'humidity_high',
        message: '车厢湿度超过60%阈值，请关注货物状态',
        timestamp: '2026-04-27 00:00',
        resolved: true
      },
      {
        id: 'LA-003-02',
        type: 'delay',
        message: '运输途中因高速公路施工预计延迟2小时到达',
        timestamp: '2026-04-27 08:00',
        resolved: false
      }
    ]
  }
]
