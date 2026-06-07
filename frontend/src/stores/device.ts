import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDeviceListApi, getDeviceDetailApi, startWashApi, pauseWashApi, continueWashApi } from '@/api/device'

export interface Device {
  id: number
  name: string
  code: string
  type: 'washer' | 'dryer'
  status: 'idle' | 'running' | 'paused' | 'fault' | 'maintenance'
  location: string
  lat: number
  lng: number
  remainingTime?: number
  currentProgram?: string
  firmwareVersion?: string
  lastMaintenance?: string
  powerConsumption?: number
  waterConsumption?: number
}

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<Device[]>([])
  const currentDevice = ref<Device | null>(null)
  const loading = ref(false)

  async function fetchDevices(params?: any) {
    loading.value = true
    try {
      const res = await getDeviceListApi(params)
      devices.value = res.data.list || res.data
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchDeviceDetail(id: number) {
    loading.value = true
    try {
      const res = await getDeviceDetailApi(id)
      currentDevice.value = res.data
      return res
    } finally {
      loading.value = false
    }
  }

  async function startWash(deviceId: number, program: string, duration: number) {
    const res = await startWashApi(deviceId, { program, duration })
    return res
  }

  async function pauseWash(deviceId: number) {
    const res = await pauseWashApi(deviceId)
    return res
  }

  async function continueWash(deviceId: number) {
    const res = await continueWashApi(deviceId)
    return res
  }

  function clearCurrentDevice() {
    currentDevice.value = null
  }

  return {
    devices,
    currentDevice,
    loading,
    fetchDevices,
    fetchDeviceDetail,
    startWash,
    pauseWash,
    continueWash,
    clearCurrentDevice
  }
})
