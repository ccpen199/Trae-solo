import { create } from 'zustand'

interface TrackingNode {
  time: string
  location: string
  status: string
  description: string
}

interface TrackingResult {
  waybillNo: string
  status: 'in_transit' | 'delivered' | 'exception' | 'picked_up' | 'out_for_delivery' | 'pending'
  sender: { name: string; city: string }
  receiver: { name: string; city: string }
  nodes: TrackingNode[]
  currentPosition: { lat: number; lng: number }
  estimatedDelivery: string
  exception?: { type: string; message: string }
}

interface AddressBookItem {
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  address: string
  isDefault: boolean
  tag: 'home' | 'office' | 'other'
}

interface OrderItem {
  id: string
  waybillNo: string
  status: string
  serviceType: string
  weight: number
  fee: number
  senderAddress: string
  receiverAddress: string
  createdAt: string
}

interface Coupon {
  id: string
  code: string
  amount: number
  type: string
  expiresAt: string
  used: boolean
}

interface NetworkPoint {
  id: string
  name: string
  address: string
  phone: string
  businessHours: string
  location: { lat: number; lng: number }
  serviceRadius: number
  status: 'active' | 'inactive'
  distance?: number
}

interface EstimateTier {
  type: 'economy' | 'standard' | 'express'
  name: string
  price: number
  estimatedDays: string
  description: string
}

interface User {
  id: string
  phone: string
  name: string
  role: string
}

interface AppState {
  currentUser: User | null
  orders: OrderItem[]
  trackingResult: TrackingResult | null
  addressBook: AddressBookItem[]
  coupons: Coupon[]
  networkPoints: NetworkPoint[]
  estimateTiers: EstimateTier[]
  loading: boolean

  fetchOrders: () => Promise<void>
  fetchTracking: (type: string, value: string) => Promise<void>
  fetchAddressBook: () => Promise<void>
  addAddress: (data: Omit<AddressBookItem, 'id'>) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
  fetchCoupons: () => Promise<void>
  fetchCoverage: (lat: number, lng: number) => Promise<void>
  fetchEstimate: (data: {
    origin: { province: string; city: string; district: string }
    destination: { province: string; city: string; district: string }
    weight: number
    volume: number
  }) => Promise<void>
  createOrder: (data: Record<string, unknown>) => Promise<Record<string, unknown> | null>
}

const STATUS_MAP: Record<string, string> = {
  picked_up: '已揽收', in_transit: '运输中', out_for_delivery: '派送中',
  delivered: '已签收', exception: '异常', pending: '待取件',
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'u1',
    phone: '138****8000',
    name: '张伟',
    role: 'user',
  },
  orders: [],
  trackingResult: null,
  addressBook: [],
  coupons: [],
  networkPoints: [],
  estimateTiers: [],
  loading: false,

  fetchOrders: async () => {
    const uid = get().currentUser?.id
    set({ loading: true })
    try {
      const res = await fetch(`/api/orders?user_id=${uid}&page=1&pageSize=20`)
      const json = await res.json()
      if (json.success && json.data?.list) {
        const orders: OrderItem[] = json.data.list.map((o: any) => ({
          id: o.id,
          waybillNo: o.waybill_no,
          status: o.status,
          serviceType: o.service_type,
          weight: o.weight,
          fee: o.fee,
          senderAddress: o.sender_address,
          receiverAddress: o.receiver_address,
          createdAt: o.created_at?.replace('T', ' ').slice(0, 16) || '',
        }))
        set({ orders, loading: false })
        return
      }
      set({ orders: mockOrders, loading: false })
    } catch {
      set({ orders: mockOrders, loading: false })
    }
  },

  fetchTracking: async (type, value) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/tracking?type=${type}&value=${encodeURIComponent(value)}`)
      const json = await res.json()
      if (json.success && json.data?.list?.length > 0) {
        const t = json.data.list[0]
        let parsedNodes: TrackingNode[] = []
        try {
          const rawNodes = typeof t.nodes === 'string' ? JSON.parse(t.nodes) : t.nodes
          parsedNodes = (Array.isArray(rawNodes) ? rawNodes : []).map((n: any) => ({
            time: n.time,
            location: n.location,
            status: STATUS_MAP[n.status] || n.status,
            description: n.description,
          }))
        } catch { parsedNodes = [] }
        let curPos = { lat: 31.23, lng: 121.47 }
        try {
          const raw = t.current_position || t.current_location
          curPos = typeof raw === 'string' ? JSON.parse(raw) : (raw && typeof raw === 'object' ? raw : { lat: 31.23, lng: 121.47 })
        } catch { /* fallback */ }
        const senderAddr = t.sender_address || ''
        const receiverAddr = t.receiver_address || ''
        const result: TrackingResult = {
          waybillNo: t.waybill_no,
          status: t.status as any,
          sender: { name: (t.sender_name || '寄件人').slice(0, 1) + '**', city: senderAddr.slice(0, 2) || '上海' },
          receiver: { name: (t.receiver_name || '收件人').slice(0, 1) + '**', city: receiverAddr.slice(0, 2) || '北京' },
          nodes: parsedNodes,
          currentPosition: curPos,
          estimatedDelivery: t.estimated_delivery || '2026-06-15',
          exception: t.exception_message ? { type: t.exception_type || '异常', message: t.exception_message } : (t.exception_type ? { type: t.exception_type, message: '快件异常，请联系客服' } : undefined),
        }
        set({ trackingResult: result, loading: false })
        return
      }
      set({ trackingResult: null, loading: false })
    } catch {
      set({ trackingResult: null, loading: false })
    }
  },

  fetchAddressBook: async () => {
    const uid = get().currentUser?.id
    try {
      const res = await fetch(`/api/address-book?user_id=${uid}&pageSize=50`)
      const json = await res.json()
      if (json.success && json.data?.list) {
        const items: AddressBookItem[] = json.data.list.map((a: any) => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          province: a.province,
          city: a.city,
          district: a.district,
          address: a.address,
          isDefault: !!a.is_default,
          tag: (a.tag as any) || 'other',
        }))
        set({ addressBook: items })
        return
      }
      set({ addressBook: mockAddresses })
    } catch {
      set({ addressBook: mockAddresses })
    }
  },

  addAddress: async (data) => {
    const uid = get().currentUser?.id
    try {
      const res = await fetch('/api/address-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, ...data, is_default: data.isDefault ? 1 : 0 }),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchAddressBook()
        return json.data || null
      }
      return null
    } catch {
      return null
    }
  },

  deleteAddress: async (id) => {
    try { await fetch(`/api/address-book/${id}`, { method: 'DELETE' }) } catch { /* noop */ }
    set((s) => ({ addressBook: s.addressBook.filter((a) => a.id !== id) }))
  },

  fetchCoupons: async () => {
    const uid = get().currentUser?.id
    try {
      const res = await fetch(`/api/profiling/coupons?user_id=${uid}`)
      const json = await res.json()
      if (json.success && json.data) {
        const list: Coupon[] = json.data.map((c: any) => ({
          id: c.id, code: c.code, amount: c.discount_amount || c.amount,
          type: c.type || 'fixed', expiresAt: c.expires_at,
          used: c.used || c.status === 'used',
        }))
        set({ coupons: list })
        return
      }
      set({ coupons: mockCoupons })
    } catch {
      set({ coupons: mockCoupons })
    }
  },

  fetchCoverage: async (lat, lng) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/networks/nearby?lat=${lat}&lng=${lng}&radius=10`)
      const json = await res.json()
      if (json.success && json.data) {
        const items: NetworkPoint[] = json.data.map((n: any) => ({
          id: n.id,
          name: n.name,
          address: n.address,
          phone: n.phone,
          businessHours: n.business_hours,
          location: { lat: n.lat, lng: n.lng },
          serviceRadius: n.service_radius,
          status: n.status as any,
          distance: n.distance,
        }))
        set({ networkPoints: items, loading: false })
        return
      }
      set({ networkPoints: mockNetworks, loading: false })
    } catch {
      set({ networkPoints: mockNetworks, loading: false })
    }
  },

  fetchEstimate: async (data) => {
    set({ loading: true })
    try {
      const res = await fetch('/api/estimate/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: data.weight,
          volume: data.volume,
          city_from: data.origin.city || data.origin.province,
          city_to: data.destination.city || data.destination.province,
          from_address: `${data.origin.province}${data.origin.city}${data.origin.district}`,
          to_address: `${data.destination.province}${data.destination.city}${data.destination.district}`,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.quotes) {
        const NAMES: Record<string, string> = { economy: '经济件', standard: '标准件', express: '特快件' }
        const DESCS: Record<string, string> = {
          economy: '经济实惠，适合不急的包裹',
          standard: '性价比之选，时效稳定',
          express: '极速达，急件首选',
        }
        const tiers: EstimateTier[] = json.data.quotes.map((q: any) => ({
          type: q.service_type,
          name: NAMES[q.service_type] || q.service_name,
          price: q.fee,
          estimatedDays: `${q.estimated_days.min}-${q.estimated_days.max}天`,
          description: DESCS[q.service_type] || '',
        }))
        set({ estimateTiers: tiers, loading: false })
        return
      }
      set({ estimateTiers: mockEstimateTiers, loading: false })
    } catch {
      set({ estimateTiers: mockEstimateTiers, loading: false })
    }
  },

  createOrder: async (data) => {
    const uid = get().currentUser?.id
    set({ loading: true })
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid,
          service_type: data.serviceType,
          weight: data.weight,
          volume: data.volume,
          fee: data.estimatedFee || data.fee || 0,
          sender_name: data.senderName,
          sender_phone: data.senderPhone,
          sender_address: data.senderAddress,
          receiver_name: data.receiverName,
          receiver_phone: data.receiverPhone,
          receiver_address: data.receiverAddress,
          package_category: data.category,
          remark: data.remark || '',
        }),
      })
      const json = await res.json()
      set({ loading: false })
      if (json.success && json.data) {
        return {
          ...json.data,
          orderId: json.data.orderId || json.data.id,
          waybillNo: json.data.waybillNo || json.data.waybill_no,
          estimatedFee: json.data.estimatedFee || json.data.fee,
        }
      }
      return { orderId: `ORD${Date.now()}`, waybillNo: `YT${Math.random().toString().slice(2, 14)}`, estimatedFee: 23.5, estimatedDelivery: '2-3天' }
    } catch {
      set({ loading: false })
      return { orderId: `ORD${Date.now()}`, waybillNo: `YT${Math.random().toString().slice(2, 14)}`, estimatedFee: 23.5, estimatedDelivery: '2-3天' }
    }
  },
}))

const mockOrders: OrderItem[] = [
  { id: '1', waybillNo: 'YT20260601001', status: 'delivered', serviceType: 'standard', weight: 2.5, fee: 18, senderAddress: '上海市浦东新区陆家嘴环路1000号', receiverAddress: '北京市朝阳区建国门外大街1号', createdAt: '2026-06-08 09:00' },
  { id: '2', waybillNo: 'YT20260602002', status: 'in_transit', serviceType: 'express', weight: 0.8, fee: 25, senderAddress: '上海市徐汇区漕溪北路398号', receiverAddress: '广州市天河区天河路385号', createdAt: '2026-06-12 08:30' },
  { id: '3', waybillNo: 'YT20260603003', status: 'exception', serviceType: 'economy', weight: 5.0, fee: 15, senderAddress: '北京市海淀区中关村大街1号', receiverAddress: '成都市武侯区人民南路四段1号', createdAt: '2026-06-10 14:00' },
]

const mockTracking: TrackingResult = {
  waybillNo: 'YT20260602002',
  status: 'in_transit',
  sender: { name: '张**', city: '上海' },
  receiver: { name: '李**', city: '广州' },
  nodes: [
    { time: '2026-06-12 08:30', location: '上海市徐汇区', status: '已揽收', description: '快递员已揽收' },
    { time: '2026-06-12 14:00', location: '上海转运中心', status: '运输中', description: '已到达上海转运中心' },
    { time: '2026-06-12 22:00', location: '上海转运中心', status: '运输中', description: '已从上海转运中心发出，下一站广州转运中心' },
    { time: '2026-06-13 06:00', location: '广州转运中心', status: '运输中', description: '已到达广州转运中心' },
    { time: '2026-06-13 09:30', location: '广州市天河区', status: '派送中', description: '快递员正在派送，请保持手机畅通' },
  ],
  currentPosition: { lat: 23.13, lng: 113.32 },
  estimatedDelivery: '2026-06-13',
}

const mockAddresses: AddressBookItem[] = [
  { id: 'a1', name: '张伟', phone: '13800138001', province: '上海市', city: '上海市', district: '浦东新区', address: '陆家嘴环路1000号', isDefault: true, tag: 'office' },
  { id: 'a2', name: '张伟', phone: '13800138001', province: '上海市', city: '上海市', district: '徐汇区', address: '漕溪北路398号', isDefault: false, tag: 'home' },
  { id: 'a3', name: '王芳', phone: '13800138002', province: '北京市', city: '北京市', district: '朝阳区', address: '建国门外大街1号', isDefault: false, tag: 'other' },
]

const mockCoupons: Coupon[] = [
  { id: 'c1', code: 'NEW10', amount: 10, type: 'fixed', expiresAt: '2026-07-31', used: false },
  { id: 'c2', code: 'SUMMER20', amount: 20, type: 'fixed', expiresAt: '2026-08-31', used: false },
  { id: 'c3', code: 'VIP50', amount: 50, type: 'fixed', expiresAt: '2026-06-01', used: true },
  { id: 'c4', code: 'SPRING15', amount: 15, type: 'fixed', expiresAt: '2026-03-31', used: false },
]

const mockNetworks: NetworkPoint[] = [
  { id: 'n1', name: '浦东陆家嘴营业部', address: '上海市浦东新区世纪大道1号', phone: '021-50801001', businessHours: '08:00-20:00', location: { lat: 31.235, lng: 121.499 }, serviceRadius: 3, status: 'active', distance: 0.6 },
  { id: 'n2', name: '黄浦人民广场营业部', address: '上海市黄浦区人民大道200号', phone: '021-58342002', businessHours: '08:00-19:00', location: { lat: 31.230, lng: 121.473 }, serviceRadius: 2.5, status: 'active', distance: 2.1 },
  { id: 'n3', name: '徐汇漕河泾营业部', address: '上海市徐汇区田林路388号', phone: '021-54903003', businessHours: '09:00-18:00', location: { lat: 31.170, lng: 121.420 }, serviceRadius: 2, status: 'inactive', distance: 7.5 },
]

const mockEstimateTiers: EstimateTier[] = [
  { type: 'economy', name: '经济件', price: 15.0, estimatedDays: '3-5天', description: '经济实惠，适合不急的包裹' },
  { type: 'standard', name: '标准件', price: 23.5, estimatedDays: '2-3天', description: '性价比之选，时效稳定' },
  { type: 'express', name: '特快件', price: 38.0, estimatedDays: '1-2天', description: '极速达，急件首选' },
]
