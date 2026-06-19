import { create } from 'zustand'
import { userApi, deviceApi } from '../services/api'

export interface UserInfo {
  id: string
  nickname: string
  avatar: string
  phone: string
  studentId: string
  balance: number
  balanceWarning: number
}

export interface DeviceInfo {
  id: string
  name: string
  mac: string
  location: string
  status: 'online' | 'offline'
  type: string
}

export interface WateringStatus {
  isActive: boolean
  deviceId: string | null
  deviceName: string | null
  temperature: 'cold' | 'warm' | 'hot'
  volume: number
  amount: number
  currentTemp: number
  startTime: number | null
}

interface AppState {
  userInfo: UserInfo | null
  currentDevice: DeviceInfo | null
  myDevices: DeviceInfo[]
  recentDevices: DeviceInfo[]
  wateringStatus: WateringStatus
  loading: boolean
  setUserInfo: (info: UserInfo) => void
  setCurrentDevice: (device: DeviceInfo | null) => void
  setMyDevices: (devices: DeviceInfo[]) => void
  setRecentDevices: (devices: DeviceInfo[]) => void
  setWateringStatus: (status: Partial<WateringStatus>) => void
  fetchUserInfo: () => Promise<void>
  fetchMyDevices: () => Promise<void>
  updateBalance: (amount: number) => void
  resetWateringStatus: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  userInfo: null,
  currentDevice: null,
  myDevices: [],
  recentDevices: [],
  wateringStatus: {
    isActive: false,
    deviceId: null,
    deviceName: null,
    temperature: 'cold',
    volume: 0,
    amount: 0,
    currentTemp: 25,
    startTime: null
  },
  loading: false,

  setUserInfo: (info) => set({ userInfo: info }),
  setCurrentDevice: (device) => set({ currentDevice: device }),
  setMyDevices: (devices) => set({ myDevices: devices }),
  setRecentDevices: (devices) => set({ recentDevices: devices }),
  setWateringStatus: (status) => set((state) => ({
    wateringStatus: { ...state.wateringStatus, ...status }
  })),

  fetchUserInfo: async () => {
    try {
      set({ loading: true })
      const res = await userApi.getMe()
      if (res.data) {
        set({ userInfo: res.data })
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchMyDevices: async () => {
    try {
      set({ loading: true })
      const res = await deviceApi.getMyDevices()
      if (res.data) {
        set({ myDevices: res.data })
      }
    } catch (error) {
      console.error('获取设备列表失败', error)
    } finally {
      set({ loading: false })
    }
  },

  updateBalance: (amount) => set((state) => {
    if (!state.userInfo) return {}
    return {
      userInfo: {
        ...state.userInfo,
        balance: Math.max(0, state.userInfo.balance + amount)
      }
    }
  }),

  resetWateringStatus: () => set({
    wateringStatus: {
      isActive: false,
      deviceId: null,
      deviceName: null,
      temperature: 'cold',
      volume: 0,
      amount: 0,
      currentTemp: 25,
      startTime: null
    }
  })
}))
