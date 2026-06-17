import { create } from 'zustand'

export interface User {
  id: string
  nickname: string
  avatar: string
  phone: string
}

export interface Merchant {
  id: string
  name: string
  category: string
  address: string
  phone: string
  cover: string
  images: string[]
  rating: number
  monthlySales: number
  distance: number
  tags: string[]
  businessHours: string
  description: string
  street: string
  lat: number
  lng: number
}

export interface Package {
  id: string
  merchantId: string
  merchantName: string
  title: string
  description: string
  cover: string
  images: string[]
  originalPrice: number
  discountPrice: number
  discount: number
  validPeriod: string
  applicableTime: string
  stock: number
  sold: number
  category: string
  tags: string[]
}

export interface Order {
  id: string
  userId: string
  packageId: string
  merchantId: string
  merchantName: string
  packageTitle: string
  packageCover: string
  quantity: number
  totalPrice: number
  status: 'pending' | 'used' | 'expired'
  verifyCode: string
  createdAt: string
  usedAt?: string
  expiredAt: string
}

export type CategoryType = 'food' | 'entertainment' | 'leisure' | 'shopping'
export type LocSource = 'default' | 'gps' | 'cell' | 'out_of_fence'

export interface LocInfo {
  source: LocSource
  label: string
  lat: number
  lng: number
  acc: string
  accuracy: number
  inFence: boolean
}

const SONGJIANG_CENTER = { lat: 31.03, lng: 121.22 }
const SONGJIANG_FENCE = { minLat: 30.90, maxLat: 31.15, minLng: 121.05, maxLng: 121.35 }

function isInSongjiangFence(lat: number, lng: number): boolean {
  return lat >= SONGJIANG_FENCE.minLat && lat <= SONGJIANG_FENCE.maxLat
    && lng >= SONGJIANG_FENCE.minLng && lng <= SONGJIANG_FENCE.maxLng
}

function buildLocInfo(source: LocSource, customLat?: number, customLng?: number): LocInfo {
  if (source === 'gps') {
    const lat = customLat ?? 31.051
    const lng = customLng ?? 121.247
    return { source, label: 'GPS卫星', lat, lng, acc: '50m', accuracy: 50, inFence: isInSongjiangFence(lat, lng) }
  }
  if (source === 'cell') {
    const lat = customLat ?? 31.042
    const lng = customLng ?? 121.228
    return { source, label: '基站三角', lat, lng, acc: '500m', accuracy: 500, inFence: isInSongjiangFence(lat, lng) }
  }
  if (source === 'out_of_fence') {
    const lat = customLat ?? 31.40
    const lng = customLng ?? 121.50
    return { source, label: '越界模拟·嘉定区', lat, lng, acc: 'N/A', accuracy: 0, inFence: isInSongjiangFence(lat, lng) }
  }
  return {
    source: 'default',
    label: '默认松江',
    lat: SONGJIANG_CENTER.lat,
    lng: SONGJIANG_CENTER.lng,
    acc: '1000m',
    accuracy: 1000,
    inFence: true,
  }
}

interface AppState {
  user: User | null
  location: { lat: number; lng: number } | null
  isInSongjiang: boolean
  locSource: LocSource
  locInfo: LocInfo
  merchants: Merchant[]
  packages: Package[]
  orders: Order[]
  currentCategory: CategoryType | null
  searchQuery: string
  interceptRecords: Array<{ time: string; lat: number; lng: number; reason: string }>

  setUser: (user: User | null) => void
  setLocation: (lat: number, lng: number) => void
  setIsInSongjiang: (val: boolean) => void
  setLocSource: (src: LocSource) => void
  setMerchants: (merchants: Merchant[]) => void
  setPackages: (packages: Package[]) => void
  setOrders: (orders: Order[]) => void
  setCurrentCategory: (cat: CategoryType | null) => void
  setSearchQuery: (q: string) => void
  addInterceptRecord: (time: string, lat: number, lng: number, reason: string) => void
}

const useStore = create<AppState>((set, get) => ({
  user: null,
  location: { lat: SONGJIANG_CENTER.lat, lng: SONGJIANG_CENTER.lng },
  isInSongjiang: true,
  locSource: 'default',
  locInfo: buildLocInfo('default'),
  merchants: [],
  packages: [],
  orders: [],
  currentCategory: null,
  searchQuery: '',
  interceptRecords: [],

  setUser: (user) => set({ user }),
  setLocation: (lat, lng) => {
    const inFence = isInSongjiangFence(lat, lng)
    const src = get().locSource
    set({
      location: { lat, lng },
      isInSongjiang: inFence,
      locInfo: {
        source: src,
        label: src === 'gps' ? 'GPS卫星' : src === 'cell' ? '基站三角' : src === 'out_of_fence' ? '越界模拟·嘉定区' : '默认松江',
        lat, lng,
        acc: src === 'gps' ? '50m' : src === 'cell' ? '500m' : src === 'out_of_fence' ? 'N/A' : '1000m',
        accuracy: src === 'gps' ? 50 : src === 'cell' ? 500 : src === 'out_of_fence' ? 0 : 1000,
        inFence,
      },
    })
  },
  setIsInSongjiang: (val) => set({ isInSongjiang: val }),
  setLocSource: (src) => {
    const info = buildLocInfo(src)
    set({ locSource: src, locInfo: info, isInSongjiang: info.inFence })
  },
  setMerchants: (merchants) => set({ merchants }),
  setPackages: (packages) => set({ packages }),
  setOrders: (orders) => set({ orders }),
  setCurrentCategory: (cat) => set({ currentCategory: cat }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  addInterceptRecord: (time, lat, lng, reason) => set((s) => ({
    interceptRecords: [{ time, lat, lng, reason }, ...s.interceptRecords].slice(0, 20),
  })),
}))

export default useStore
