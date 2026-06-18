export interface Institution {
  id: string
  name: string
  level: string
  type: 'hospital' | 'community' | 'pharmacy'
  address: string
  phone: string
  departments: string[]
  medicines: string[]
  lng: number
  lat: number
  distance: number
  rating: number
  workHours: string
}

export interface FilterState {
  keyword: string
  type: 'all' | 'hospital' | 'community' | 'pharmacy'
  level: string
  departments: string[]
  medicine: string
  distance: number
}

export const defaultFilter: FilterState = {
  keyword: '',
  type: 'all',
  level: 'all',
  departments: [],
  medicine: '',
  distance: 10,
}

export const allDepartments = [
  '心血管内科',
  '神经内科',
  '骨科',
  '呼吸内科',
  '消化内科',
  '儿科',
  '妇产科',
]

export const mockInstitutions: Institution[] = [
  {
    id: '1',
    name: 'XX省人民医院',
    level: '三级',
    type: 'hospital',
    address: 'XX省XX市XX区人民路128号',
    phone: '0571-88001234',
    departments: ['心血管内科', '神经内科', '骨科'],
    medicines: ['阿司匹林', '氨氯地平', '阿托伐他汀'],
    lng: 116.3975,
    lat: 39.9087,
    distance: 1.2,
    rating: 4.8,
    workHours: '周一至周日 8:00-17:30',
  },
  {
    id: '2',
    name: 'XX市第一人民医院',
    level: '三级',
    type: 'hospital',
    address: 'XX省XX市XX区解放路56号',
    phone: '0571-88005678',
    departments: ['心血管内科'],
    medicines: [],
    lng: 116.4075,
    lat: 39.9187,
    distance: 2.8,
    rating: 4.6,
    workHours: '周一至周五 8:00-17:00',
  },
  {
    id: '3',
    name: 'XX区社区卫生服务中心',
    level: '一级',
    type: 'community',
    address: 'XX省XX市XX区健康路22号',
    phone: '0571-88009012',
    departments: ['全科', '中医科'],
    medicines: [],
    lng: 116.4175,
    lat: 39.9287,
    distance: 3.5,
    rating: 4.2,
    workHours: '周一至周五 8:30-17:00',
  },
  {
    id: '4',
    name: 'XX大药房',
    level: '',
    type: 'pharmacy',
    address: 'XX省XX市XX区民生路88号',
    phone: '0571-88003456',
    departments: [],
    medicines: ['连花清瘟', '布洛芬'],
    lng: 116.3875,
    lat: 39.8987,
    distance: 0.8,
    rating: 4.5,
    workHours: '周一至周日 8:00-21:00',
  },
]
