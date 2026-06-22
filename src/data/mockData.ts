import type { ServiceCategory, SkillTag, Technician, AppUser } from '../types'

export const mockCategories: ServiceCategory[] = [
  { id: 'cat-1', name: '家电维修', parentId: null, icon: 'tv' },
  { id: 'cat-1-1', name: '空调维修', parentId: 'cat-1' },
  { id: 'cat-1-2', name: '冰箱维修', parentId: 'cat-1' },
  { id: 'cat-1-3', name: '洗衣机维修', parentId: 'cat-1' },
  { id: 'cat-1-4', name: '电视维修', parentId: 'cat-1' },
  { id: 'cat-2', name: '水电维修', parentId: null, icon: 'zap' },
  { id: 'cat-2-1', name: '电路维修', parentId: 'cat-2' },
  { id: 'cat-2-2', name: '水管维修', parentId: 'cat-2' },
  { id: 'cat-2-3', name: '卫浴安装', parentId: 'cat-2' },
  { id: 'cat-3', name: '装修服务', parentId: null, icon: 'hammer' },
  { id: 'cat-3-1', name: '墙面修补', parentId: 'cat-3' },
  { id: 'cat-3-2', name: '地板维修', parentId: 'cat-3' },
  { id: 'cat-3-3', name: '门窗维修', parentId: 'cat-3' },
  { id: 'cat-4', name: '管道疏通', parentId: null, icon: 'droplets' },
  { id: 'cat-4-1', name: '马桶疏通', parentId: 'cat-4' },
  { id: 'cat-4-2', name: '下水道疏通', parentId: 'cat-4' },
]

export const mockSkillTags: SkillTag[] = [
  { id: 'skill-1', name: '变频空调', categoryId: 'cat-1-1' },
  { id: 'skill-2', name: '中央空调', categoryId: 'cat-1-1' },
  { id: 'skill-3', name: '加氟保养', categoryId: 'cat-1-1' },
  { id: 'skill-4', name: '压缩机维修', categoryId: 'cat-1-2' },
  { id: 'skill-5', name: '电路检测', categoryId: 'cat-2-1' },
  { id: 'skill-6', name: '漏电排查', categoryId: 'cat-2-1' },
  { id: 'skill-7', name: '水管焊接', categoryId: 'cat-2-2' },
  { id: 'skill-8', name: '高压疏通', categoryId: 'cat-4-1' },
]

export const mockTechnicians: Technician[] = [
  {
    id: 'tech-1',
    name: '张师傅',
    phone: '138****1234',
    skillTags: ['skill-1', 'skill-2', 'skill-3'],
    serviceRadius: 10,
    rating: 4.8,
    reviewCount: 156,
    certificates: [
      {
        id: 'cert-1',
        name: '电工操作证',
        imageUrl: '',
        ocrData: '电工特种作业操作证，证号：T5101XXXXXXXXXXXX，有效期至2028-06-15',
        verified: true,
        verifiedAt: '2024-01-15T10:00:00Z',
      },
    ],
    location: { lat: 31.2304, lng: 121.4737 },
    frozen: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tech-2',
    name: '李师傅',
    phone: '139****5678',
    skillTags: ['skill-4', 'skill-5', 'skill-6'],
    serviceRadius: 8,
    rating: 4.9,
    reviewCount: 89,
    certificates: [],
    location: { lat: 31.2350, lng: 121.4800 },
    frozen: false,
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'tech-3',
    name: '王师傅',
    phone: '137****9012',
    skillTags: ['skill-5', 'skill-6', 'skill-7'],
    serviceRadius: 15,
    rating: 4.5,
    reviewCount: 42,
    certificates: [],
    location: { lat: 31.2400, lng: 121.4650 },
    frozen: false,
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'tech-4',
    name: '赵师傅',
    phone: '136****3456',
    skillTags: ['skill-7', 'skill-8'],
    serviceRadius: 5,
    rating: 4.2,
    reviewCount: 15,
    certificates: [],
    location: { lat: 31.2250, lng: 121.4900 },
    frozen: false,
    createdAt: '2024-04-01T00:00:00Z',
  },
]

export const mockUsers: AppUser[] = [
  {
    id: 'user-1',
    role: 'user',
    name: '陈先生',
    phone: '135****7890',
  },
]

export const getSubCategories = (parentId: string | null): ServiceCategory[] => {
  return mockCategories.filter(c => c.parentId === parentId)
}

export const getCategoryById = (id: string): ServiceCategory | undefined => {
  return mockCategories.find(c => c.id === id)
}

export const getCategoryPath = (categoryId: string): ServiceCategory[] => {
  const path: ServiceCategory[] = []
  let current: ServiceCategory | undefined = getCategoryById(categoryId)
  while (current) {
    path.unshift(current)
    current = current.parentId ? getCategoryById(current.parentId) : undefined
  }
  return path
}
