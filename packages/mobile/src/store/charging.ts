import { create } from 'zustand'

interface ChargingState {
  isCharging: boolean
  orderId: string | null
  stationInfo: any
  chargingData: any
  setCharging: (orderId: string, stationInfo: any) => void
  stopCharging: () => void
  updateChargingData: (data: any) => void
}

const useChargingStore = create<ChargingState>((set) => ({
  isCharging: false,
  orderId: null,
  stationInfo: null,
  chargingData: null,
  setCharging: (orderId, stationInfo) =>
    set({ isCharging: true, orderId, stationInfo }),
  stopCharging: () =>
    set({ isCharging: false, orderId: null, stationInfo: null, chargingData: null }),
  updateChargingData: (data) => set({ chargingData: data })
}))

export default useChargingStore
