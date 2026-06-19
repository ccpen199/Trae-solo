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
  introducerId?: string
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
  taskId?: string
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
  appointmentId?: string
  taskId?: string
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
  duration?: number
}

export interface ModalState {
  type:
    | 'customer_detail'
    | 'add_customer'
    | 'appointment_detail'
    | 'performance_detail'
    | 'qr_detail'
    | 'account_settings'
    | 'batch_detail'
    | 'inventory_detail'
    | 'promotion_detail'
    | 'task_detail'
    | null
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
  convertedCustomerIds?: string[]
}

export interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  deadline: string
  status: 'todo' | 'doing' | 'done' | 'cancelled'
  customerId?: string
  appointmentId?: string
  createdAt: string
  updatedAt: string
  description?: string
  type: 'follow_up' | 'appointment' | 'service_review' | 'training' | 'other'
  followUpRecords?: { time: string; content: string }[]
}

export interface QrScanRecord {
  id: string
  scanTime: string
  viewerIp?: string
  viewerLocation?: string
  channel: string
  customerId?: string
  customerName?: string
  registered: boolean
  compliancePassed: boolean
  riskNote?: string
}

interface BusinessState {
  customers: Customer[]
  appointments: Appointment[]
  serviceRecords: ServiceRecord[]
  shareTracks: ShareTrack[]
  tasks: Task[]
  qrScanRecords: QrScanRecord[]
  toasts: Toast[]
  modal: ModalState
  currentViewRole: UserRole | null

  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  openModal: (type: ModalState['type'], data?: unknown) => void
  closeModal: () => void

  addCustomer: (customer: Omit<Customer, 'id'>) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void

  setCurrentViewRole: (role: UserRole | null) => void

  addAppointment: (apt: Omit<Appointment, 'id'>) => Appointment
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void

  addShareTrack: (track: Omit<ShareTrack, 'id' | 'shareTime'>) => void
  incrementShareViews: (id: string) => void

  addServiceRecord: (record: Omit<ServiceRecord, 'id' | 'hash' | 'status'>) => ServiceRecord

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  addTaskFollowUp: (taskId: string, content: string) => void
  completeTask: (id: string) => void

  addQrScanRecord: (record: Omit<QrScanRecord, 'id'>) => void
  bindScanToCustomer: (scanId: string, customerId: string, customerName: string) => void
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

const now = new Date().toLocaleString('zh-CN')

const initialTasks: Task[] = [
  { id: 'T001', title: '跟进陈雅婷的蛋白粉复购', priority: 'high', deadline: '今日 14:00', status: 'todo', customerId: 'C001', createdAt: now, updatedAt: now, type: 'follow_up', description: '客户上月购买的蛋白粉即将用完，电话跟进复购意向', followUpRecords: [{ time: '2026-06-17 10:20', content: '已发送产品使用关怀微信，客户回复周末会考虑' }] },
  { id: 'T002', title: '参加总部新品培训直播', priority: 'high', deadline: '今日 19:30', status: 'todo', createdAt: now, updatedAt: now, type: 'training', description: '新品松花粉升级版产品知识培训' },
  { id: 'T003', title: '整理本周新增客户资料', priority: 'medium', deadline: '今天内', status: 'done', createdAt: now, updatedAt: now, type: 'other', followUpRecords: [{ time: '2026-06-19 09:00', content: '6 位客户资料已录入 CRM，标注跟进时间' }] },
  { id: 'T004', title: '为赵海涛预约生活馆体验', priority: 'low', deadline: '本周', status: 'todo', customerId: 'C006', createdAt: now, updatedAt: now, type: 'appointment', description: '赵海涛表示下周有空到店体验体质检测服务' },
]

const initialQrScanRecords: QrScanRecord[] = [
  { id: 'QR001', scanTime: '2026-06-19 08:32', viewerLocation: '上海市浦东新区', channel: '微信朋友圈', customerId: 'C004', customerName: '王俊杰', registered: true, compliancePassed: true },
  { id: 'QR002', scanTime: '2026-06-18 20:15', viewerLocation: '上海市徐汇区', channel: '微信好友', registered: false, compliancePassed: true },
  { id: 'QR003', scanTime: '2026-06-18 15:44', viewerLocation: '上海市长宁区', channel: '线下海报', customerId: 'C003', customerName: '张秀兰', registered: true, compliancePassed: true },
  { id: 'QR004', scanTime: '2026-06-17 11:08', viewerLocation: '北京市朝阳区', channel: '微信群转发', registered: false, compliancePassed: false, riskNote: '跨区域展业疑似风险，已进入地理围栏复核' },
  { id: 'QR005', scanTime: '2026-06-17 09:22', viewerLocation: '上海市静安区', channel: '名片二维码', customerId: 'C005', customerName: '李美华', registered: true, compliancePassed: true },
]

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      customers: initialCustomers,
      appointments: initialAppointments,
      serviceRecords: initialServiceRecords,
      shareTracks: [],
      tasks: initialTasks,
      qrScanRecords: initialQrScanRecords,
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

      addCustomer: (customer) => {
        const id = 'C' + String(get().customers.length + 1).padStart(3, '0')
        const record = { ...customer, id }
        set((state) => ({ customers: [record, ...state.customers] }))
        return record
      },
      updateCustomer: (id, patch) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...patch, lastContact: '刚刚' } : c)),
        })),

      setCurrentViewRole: (role) => set({ currentViewRole: role }),

      addAppointment: (apt) => {
        const id = 'AP' + String(get().appointments.length + 1).padStart(3, '0')
        const record = { ...apt, id }
        set((state) => ({ appointments: [record, ...state.appointments] }))
        if (apt.taskId) {
          get().updateTask(apt.taskId, { status: 'doing', appointmentId: id, updatedAt: new Date().toLocaleString('zh-CN') })
          get().addTaskFollowUp(apt.taskId, `已为客户预约 ${apt.store} ${apt.service}，时间 ${apt.date} ${apt.time}`)
        }
        return record
      },
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

      addServiceRecord: (record) => {
        const id = 'SR' + String(get().serviceRecords.length + 1).padStart(3, '0')
        const serviceRecord = {
          ...record,
          id,
          hash: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
          status: 'pending' as const,
        }
        set((state) => ({ serviceRecords: [serviceRecord, ...state.serviceRecords] }))
        return serviceRecord
      },

      addTask: (task) => {
        const id = 'T' + String(get().tasks.length + 1).padStart(3, '0')
        const ts = new Date().toLocaleString('zh-CN')
        const record = { ...task, id, createdAt: ts, updatedAt: ts }
        set((state) => ({ tasks: [record, ...state.tasks] }))
        return record
      },
      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toLocaleString('zh-CN') } : t)),
        })),
      addTaskFollowUp: (id, content) => {
        const record = { time: new Date().toLocaleString('zh-CN'), content }
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, followUpRecords: [...(t.followUpRecords || []), record], updatedAt: record.time }
              : t
          ),
        }))
      },
      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'done', updatedAt: new Date().toLocaleString('zh-CN') } : t)),
        }))
      },

      addQrScanRecord: (record) =>
        set((state) => ({
          qrScanRecords: [
            { ...record, id: 'QR' + String(state.qrScanRecords.length + 1).padStart(3, '0') },
            ...state.qrScanRecords,
          ],
        })),
      bindScanToCustomer: (scanId, customerId, customerName) =>
        set((state) => ({
          qrScanRecords: state.qrScanRecords.map((s) =>
            s.id === scanId ? { ...s, customerId, customerName, registered: true } : s
          ),
        })),
    }),
    {
      name: 'health_platform_business',
      partialize: (state) => ({
        customers: state.customers,
        appointments: state.appointments,
        serviceRecords: state.serviceRecords,
        shareTracks: state.shareTracks,
        tasks: state.tasks,
        qrScanRecords: state.qrScanRecords,
        currentViewRole: state.currentViewRole,
      }),
    }
  )
)
