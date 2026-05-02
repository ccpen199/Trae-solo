import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useMonitorStore = defineStore('monitor', () => {
  const waybillLocations = ref({})
  const tracks = ref([])
  const exceptions = ref([])

  async function fetchWaybillLocations() {
    const res = await request.get('/monitor/waybills')
    waybillLocations.value = res.data
    return res.data
  }

  async function fetchWaybillLocation(id) {
    const res = await request.get(`/monitor/waybills/${id}`)
    waybillLocations.value[id] = res.data
    return res.data
  }

  async function fetchTracks(waybillId) {
    const res = await request.get(`/tracks/${waybillId}`)
    tracks.value = res.data
    return res.data
  }

  async function fetchTrackReplay(waybillId) {
    const res = await request.get(`/tracks/${waybillId}/replay`)
    return res.data
  }

  async function fetchExceptions(params) {
    const res = await request.get('/exceptions', { params })
    exceptions.value = res.data
    return res.data
  }

  async function createException(data) {
    return await request.post('/exceptions', data)
  }

  async function handleException(id, data) {
    return await request.put(`/exceptions/${id}`, data)
  }

  return {
    waybillLocations,
    tracks,
    exceptions,
    fetchWaybillLocations,
    fetchWaybillLocation,
    fetchTracks,
    fetchTrackReplay,
    fetchExceptions,
    createException,
    handleException
  }
})
