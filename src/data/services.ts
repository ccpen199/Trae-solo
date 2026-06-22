import { VaccineSite, PcrSite, OilPrice } from '../types'

export const vaccineSites: VaccineSite[] = [
  {
    id: 'v1',
    name: '朝阳区建外社区卫生服务中心',
    address: '北京市朝阳区建国门外大街建华南路18号',
    district: '朝阳区',
    phone: '010-65681234',
    vaccines: [
      { name: '新冠灭活疫苗（国药）', available: 128, total: 500, updatedAt: '2026-06-21 09:30' },
      { name: '新冠重组蛋白疫苗（智飞）', available: 0, total: 200, updatedAt: '2026-06-21 09:30' },
      { name: 'HPV九价疫苗', available: 15, total: 30, updatedAt: '2026-06-21 09:00' },
      { name: '流感疫苗', available: 200, total: 300, updatedAt: '2026-06-21 09:00' },
    ],
    queueLength: 12,
    waitMinutes: 25,
  },
  {
    id: 'v2',
    name: '海淀区中关村社区卫生服务中心',
    address: '北京市海淀区中关村南路36号',
    district: '海淀区',
    phone: '010-62567890',
    vaccines: [
      { name: '新冠灭活疫苗（国药）', available: 256, total: 500, updatedAt: '2026-06-21 09:30' },
      { name: '新冠灭活疫苗（科兴）', available: 189, total: 400, updatedAt: '2026-06-21 09:30' },
      { name: 'HPV四价疫苗', available: 8, total: 20, updatedAt: '2026-06-21 09:00' },
      { name: '儿童常规疫苗', available: 450, total: 500, updatedAt: '2026-06-21 09:00' },
    ],
    queueLength: 8,
    waitMinutes: 15,
  },
  {
    id: 'v3',
    name: '西城区金融街社区卫生服务中心',
    address: '北京市西城区金融大街甲15号',
    district: '西城区',
    phone: '010-66554321',
    vaccines: [
      { name: '新冠灭活疫苗（国药）', available: 312, total: 600, updatedAt: '2026-06-21 09:30' },
      { name: 'HPV九价疫苗', available: 23, total: 30, updatedAt: '2026-06-21 09:00' },
      { name: '带状疱疹疫苗', available: 45, total: 60, updatedAt: '2026-06-21 09:00' },
    ],
    queueLength: 3,
    waitMinutes: 8,
  },
  {
    id: 'v4',
    name: '东城区东直门社区卫生服务中心',
    address: '北京市东城区东直门外大街48号',
    district: '东城区',
    phone: '010-64176543',
    vaccines: [
      { name: '新冠灭活疫苗（国药）', available: 178, total: 400, updatedAt: '2026-06-21 09:30' },
      { name: '流感疫苗', available: 0, total: 200, updatedAt: '2026-06-21 09:00' },
      { name: '肺炎球菌疫苗', available: 67, total: 100, updatedAt: '2026-06-21 09:00' },
    ],
    queueLength: 25,
    waitMinutes: 45,
  },
]

export const pcrSites: PcrSite[] = [
  {
    id: 'p1',
    name: '北京协和医院',
    address: '北京市东城区帅府园1号',
    district: '东城区',
    lat: 39.9136,
    lng: 116.4141,
    openHours: '全天24小时',
    price: 16,
    queuePrediction: [
      { time: '08:00-10:00', peopleCount: 45, waitMinutes: 30 },
      { time: '10:00-12:00', peopleCount: 32, waitMinutes: 20 },
      { time: '12:00-14:00', peopleCount: 18, waitMinutes: 10 },
      { time: '14:00-16:00', peopleCount: 38, waitMinutes: 25 },
      { time: '16:00-18:00', peopleCount: 56, waitMinutes: 40 },
      { time: '18:00-20:00', peopleCount: 28, waitMinutes: 15 },
    ],
  },
  {
    id: 'p2',
    name: '北京朝阳医院',
    address: '北京市朝阳区工人体育场南路8号',
    district: '朝阳区',
    lat: 39.9302,
    lng: 116.4447,
    openHours: '8:00-20:00',
    price: 14,
    queuePrediction: [
      { time: '08:00-10:00', peopleCount: 67, waitMinutes: 45 },
      { time: '10:00-12:00', peopleCount: 45, waitMinutes: 30 },
      { time: '12:00-14:00', peopleCount: 23, waitMinutes: 15 },
      { time: '14:00-16:00', peopleCount: 52, waitMinutes: 35 },
      { time: '16:00-18:00', peopleCount: 78, waitMinutes: 55 },
      { time: '18:00-20:00', peopleCount: 34, waitMinutes: 20 },
    ],
  },
  {
    id: 'p3',
    name: '北京大学第三医院',
    address: '北京市海淀区花园北路49号',
    district: '海淀区',
    lat: 39.9869,
    lng: 116.3548,
    openHours: '8:00-22:00',
    price: 16,
    queuePrediction: [
      { time: '08:00-10:00', peopleCount: 89, waitMinutes: 60 },
      { time: '10:00-12:00', peopleCount: 62, waitMinutes: 40 },
      { time: '12:00-14:00', peopleCount: 35, waitMinutes: 20 },
      { time: '14:00-16:00', peopleCount: 71, waitMinutes: 48 },
      { time: '16:00-18:00', peopleCount: 95, waitMinutes: 65 },
      { time: '18:00-20:00', peopleCount: 48, waitMinutes: 30 },
      { time: '20:00-22:00', peopleCount: 22, waitMinutes: 12 },
    ],
  },
]

export const oilPrices: OilPrice[] = [
  {
    cityId: 'bj',
    date: '2026-06-15',
    gasoline: [
      { type: '89号', price: 7.68, change: 0.12 },
      { type: '92号', price: 8.15, change: 0.13 },
      { type: '95号', price: 8.76, change: 0.14 },
      { type: '98号', price: 9.82, change: 0.15 },
    ],
    diesel: [
      { type: '0号', price: 7.85, change: 0.12 },
    ],
    source: '国家发展和改革委员会',
    nextAdjustDate: '2026-06-28',
  },
  {
    cityId: 'sh',
    date: '2026-06-15',
    gasoline: [
      { type: '89号', price: 7.72, change: 0.12 },
      { type: '92号', price: 8.19, change: 0.13 },
      { type: '95号', price: 8.80, change: 0.14 },
      { type: '98号', price: 9.88, change: 0.15 },
    ],
    diesel: [
      { type: '0号', price: 7.89, change: 0.12 },
    ],
    source: '国家发展和改革委员会',
    nextAdjustDate: '2026-06-28',
  },
  {
    cityId: 'gz',
    date: '2026-06-15',
    gasoline: [
      { type: '89号', price: 7.75, change: 0.12 },
      { type: '92号', price: 8.22, change: 0.13 },
      { type: '95号', price: 8.83, change: 0.14 },
      { type: '98号', price: 9.91, change: 0.15 },
    ],
    diesel: [
      { type: '0号', price: 7.92, change: 0.12 },
    ],
    source: '国家发展和改革委员会',
    nextAdjustDate: '2026-06-28',
  },
]
