import type { FarmPlot } from '@/types'

export const farmPlots: FarmPlot[] = [
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
