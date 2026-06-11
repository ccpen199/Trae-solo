import { create } from "zustand"
import type { User, UserRole, Transaction, DispenseSession } from "@/types"
import { users, transactions } from "@/data/mock"

interface AppState {
  currentUser: User | null
  isLoggedIn: boolean
  login: (phone: string, role: UserRole) => void
  logout: () => void
  transactions: Transaction[]
  dispenseSession: DispenseSession | null
  startDispense: (deviceId: string, deviceName: string, temperature: number) => void
  stopDispense: () => void
  updateDispense: (volume: number, amount: number) => void
  addTransaction: (txn: Transaction) => void
  addBalance: (amount: number) => void
  notifications: number
  clearNotifications: () => void
}

const readSavedSession = (): { user: User | null; isLoggedIn: boolean } => {
  const role = localStorage.getItem("wateriot-role") as UserRole | null
  const phone = localStorage.getItem("wateriot-phone")
  const token = localStorage.getItem("wateriot-token")
  if (!token || !role || !["student", "operator", "investor"].includes(role)) {
    return { user: null, isLoggedIn: false }
  }
  const user = users.find((u) => u.role === role) || users[0]
  return { user: { ...user, phone: phone || user.phone }, isLoggedIn: true }
}

const savedSession = readSavedSession()

export const useStore = create<AppState>((set, get) => ({
  currentUser: savedSession.user,
  isLoggedIn: savedSession.isLoggedIn,
  transactions: transactions,
  dispenseSession: null,
  notifications: 5,

  login: (phone: string, role: UserRole) => {
    const user = users.find((u) => u.role === role) || { id: "U001", phone, role, balance: 25.6, boundDevices: ["DEV001", "DEV005", "DEV007"] }
    localStorage.setItem("wateriot-token", `mock-token-${role}`)
    localStorage.setItem("wateriot-role", role)
    localStorage.setItem("wateriot-phone", phone)
    set({ currentUser: { ...user, phone }, isLoggedIn: true })
  },

  logout: () => {
    localStorage.removeItem("wateriot-token")
    localStorage.removeItem("wateriot-role")
    localStorage.removeItem("wateriot-phone")
    set({ currentUser: null, isLoggedIn: false, dispenseSession: null })
  },

  startDispense: (deviceId: string, deviceName: string, temperature: number) => {
    set({
      dispenseSession: {
        deviceId,
        deviceName,
        waterTemperature: temperature,
        startTime: new Date().toISOString(),
        isActive: true,
        currentVolume: 0,
        currentAmount: 0,
      },
    })
  },

  stopDispense: () => {
    const session = get().dispenseSession
    if (session) {
      const txn: Transaction = {
        id: `TXN${Date.now()}`,
        userId: get().currentUser?.id || "U001",
        deviceId: session.deviceId,
        startTime: session.startTime,
        endTime: new Date().toISOString(),
        waterTemperature: session.waterTemperature,
        volume: session.currentVolume,
        amount: session.currentAmount,
        encrypted: true,
        nonce: `n_${Math.random().toString(36).slice(2, 10)}`,
      }
      set((state) => ({
        transactions: [txn, ...state.transactions],
        dispenseSession: null,
        currentUser: state.currentUser
          ? { ...state.currentUser, balance: Math.max(0, state.currentUser.balance - txn.amount) }
          : null,
      }))
    }
  },

  updateDispense: (volume: number, amount: number) => {
    set((state) => ({
      dispenseSession: state.dispenseSession
        ? { ...state.dispenseSession, currentVolume: volume, currentAmount: amount }
        : null,
    }))
  },

  addTransaction: (txn: Transaction) => {
    set((state) => ({ transactions: [txn, ...state.transactions] }))
  },

  addBalance: (amount: number) => {
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, balance: state.currentUser.balance + amount }
        : null,
    }))
  },

  clearNotifications: () => set({ notifications: 0 }),
}))
