import type { ShopInfo } from '@/types'

export const shops: ShopInfo[] = [
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
