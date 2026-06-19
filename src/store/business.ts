import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from './auth'

export interface Customer {
  id: string
  name: string
  avatar: string
  phone: string
  level: string
  tag: string
  totalAmount: number
  orderCount: number
  lastContact: string
  status: string
  registerDate: string
  region: string
  healthConcerns: string[]
  source: string
  notes?: string
  followUpDate?: string
}

export interface Appointment {
  id: string
  customer: string
  customerId: string
  phone: string
  service: string
  store: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  note?: string
  avatar: string
}

export interface ServiceRecord {
  id: string
  customer: string
  avatar: string
  service: string
  store: string
  date: string
  duration: string
  consultant: string
  products: string[]
  hash: string
  status: 'chained' | 'pending'
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
  duration?: number
}

export interface ModalState {
  type: 'customer_detail' | 'add_customer' | 'appointment_detail' | 'performance_detail' | 'qr_detail' | null
  data?: unknown
}

interface ShareTrack {
  id: string
  materialId: string
  materialTitle: string
  shareTime: string
  views: number
  clicks: number
  conversions: number
  channel: string
}

interface BusinessState {
  customers: Customer[]
  appointments: Appointment[]
  serviceRecords: ServiceRecord[]
  shareTracks: ShareTrack[]
  toasts: Toast[]
  modal: ModalState
  currentViewRole: UserRole | null

  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  openModal: (type: ModalState['type'], data?: unknown) => void
  closeModal: () => void

  addCustomer: (customer: Omit<Customer, 'id'>) => void
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  setCurrentViewRole: (role: UserRole | null) => void

  addAppointment: (apt: Omit<Appointment, 'id'>) => void
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void

  addShareTrack: (track: Omit<ShareTrack, 'id' | 'shareTime'>) => void
  incrementShareViews: (id: string) => void

  addServiceRecord: (record: Omit<ServiceRecord, 'id' | 'hash' | 'status'>) => void
}

const initialCustomers: Customer[] = [
  { id: 'C001', name: '陈雅婷', avatar: '陈', phone: '138****5821', level: 'VIP客户', tag: '核心客户', totalAmount: 38600, orderCount: 18, lastContact: '2小时前', status: 'active', registerDate: '2024-03-15', region: '上海市浦东新区', healthConcerns: ['免疫调节', '睡眠改善'], source: '线下活动', followUpDate: '2026-06-20' },
  { id: 'C002', name: '刘志强', avatar: '刘', phone: '139****3344', level: '钻石会员', tag: '高净值', totalAmount: 126800, orderCount: 45, lastContact: '昨天', status: 'active', registerDate: '2023-08-22', region: '上海市徐汇区', healthConcerns: ['心脑血管', '骨骼健康'], source: '老客户推荐', followUpDate: '2026-06-22' },
  { id: 'C003', name: '张秀兰', avatar: '张', phone: '137****7788', level: '普通会员', tag: '复购客户', totalAmount: 12400, orderCount: 8, lastContact: '3天前', status: 'active', registerDate: '2025-01-10', region: '上海市长宁区', healthConcerns: ['肠胃调理', '抗氧化'], source: '展业码扫码' },
  { id: 'C004', name: '王俊杰', avatar: '王', phone: '136****9900', level: '新客户', tag: '潜在客户', totalAmount: 0, orderCount: 0, lastContact: '刚刚', status: 'new', registerDate: '2026-06-15', region: '上海市闵行区', healthConcerns: ['体重管理'], source: '微信分享' },
  { id: 'C005', name: '李美华', avatar: '李', phone: '135****2211', level: 'VIP客户', tag: '核心客户', totalAmount: 45200, orderCount: 22, lastContact: '5天前', status: 'active', registerDate: '2024-07-08', region: '上海市静安区', healthConcerns: ['美容养颜', '内分泌'], source: '生活馆体验' },
  { id: 'C006', name: '赵海涛', avatar: '赵', phone: '134****6677', level: '普通会员', tag: '待跟进', totalAmount: 3200, orderCount: 2, lastContact: '15天前', status: 'pending', registerDate: '2025-11-20', region: '上海市松江区', healthConcerns: ['抗疲劳'], source: '线上广告', followUpDate: '2026-06-19' },
]

const initialAppointments: Appointment[] = [
  { id: 'AP001', customer: '陈雅婷', customerId: 'C001', phone: '138****5821', service: '松花粉体验+体质检测', store: '浦东旗舰店', date: '2026-06-18', time: '14:00', status: 'confirmed', avatar: '陈' },
  { id: 'AP002', customer: '刘志强', customerId: 'C002', phone: '139****3344', service: '心脑血管养护方案咨询', store: '浦东旗舰店', date: '2026-06-18', time: '15:30', status: 'pending', note: '需准备血压检测报告', avatar: '刘' },
  { id: 'AP003', customer: '王俊杰', customerId: 'C004', phone: '136****9900', service: '新客户首次体验', store: '浦东旗舰店', date: '2026-06-18', time: '10:00', status: 'completed', avatar: '王' },
  { id: 'AP004', customer: '李美华', customerId: 'C005', phone: '135****2211', service: '美容养颜方案定制', store: '徐汇体验店', date: '2026-06-19', time: '11:00', status: 'confirmed', avatar: '李' },
  { id: 'AP005', customer: '张秀兰', customerId: 'C003', phone: '137****7788', service: '定期复查', store: '长宁服务中心', date: '2026-06-20', time: '09:30', status: 'pending', avatar: '张' },
]

const initialServiceRecords: ServiceRecord[] = [
  { id: 'SR001', customer: '陈雅婷', avatar: '陈', service: '松花粉体验+体质检测', store: '浦东旗舰店', date: '2026-06-15', duration: '90 分钟', consultant: '王芳（高级健康顾问）', products: ['国珍松花粉片 x1', '体质检测报告 x1'], hash: '0x8f3a7b2c...e291', status: 'chained' },
  { id: 'SR002', customer: '刘志强', avatar: '刘', service: '心脑血管养护方案', store: '浦东旗舰店', date: '2026-06-10', duration: '120 分钟', consultant: '李明（资深营养师）', products: ['国珍竹康宁片 x2', '国珍鱼油软胶囊 x1'], hash: '0x7c2b4e8f...91d4', status: 'chained' },
]

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      customers: initialCustomers,
      appointments: initialAppointments,
      serviceRecords: initialServiceRecords,
      shareTracks: [],
      toasts: [],
      modal: { type: null, data: undefined },
      currentViewRole: null,

      addToast: (toast) => {
        const id = Math.random().toString(36).slice(2)
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id, duration: toast.duration ?? 3000 }],
        }))
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
        }, toast.duration ?? 3000)
      },
      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      openModal: (type, data) => set({ modal: { type, data } }),
      closeModal: () => set({ modal: { type: null, data: undefined } }),

      addCustomer: (customer) =>
        set((state) => ({
          customers: [
            { ...customer, id: 'C' + String(state.customers.length + 1).padStart(3, '0') },
            ...state.customers,
          ],
        })),
      updateCustomer: (id, patch) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      setCurrentViewRole: (role) => set({ currentViewRole: role }),

      addAppointment: (apt) =>
        set((state) => ({
          appointments: [
            { ...apt, id: 'AP' + String(state.appointments.length + 1).padStart(3, '0') },
            ...state.appointments,
          ],
        })),
      updateAppointmentStatus: (id, status) =>
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      addShareTrack: (track) =>
        set((state) => ({
          shareTracks: [
            { ...track, id: 'ST' + String(state.shareTracks.length + 1).padStart(3, '0'), shareTime: new Date().toLocaleString('zh-CN') },
            ...state.shareTracks,
          ],
        })),
      incrementShareViews: (id) =>
        set((state) => ({
          shareTracks: state.shareTracks.map((s) => (s.id === id ? { ...s, views: s.views + 1 } : s)),
        })),

      addServiceRecord: (record) =>
        set((state) => ({
          serviceRecords: [
            {
              ...record,
              id: 'SR' + String(state.serviceRecords.length + 1).padStart(3, '0'),
              hash: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
              status: 'pending',
            },
            ...state.serviceRecords,
          ],
        })),
    }),
    {
      name: 'health_platform_business',
      partialize: (state) => ({
        customers: state.customers,
        appointments: state.appointments,
        serviceRecords: state.serviceRecords,
        shareTracks: state.shareTracks,
        currentViewRole: state.currentViewRole,
      }),
    }
  )
)
