import { get } from './request'

export interface HeatmapPoint {
  lng: number
  lat: number
  count: number
  areaName: string
}

export interface AreaDetail {
  id: string
  areaName: string
  driverCount: number
  averageResponseTime: number
  orderCount: number
  saturation: number
  lng: number
  lat: number
}

export interface HeatmapData {
  points: HeatmapPoint[]
  areas: AreaDetail[]
  totalDrivers: number
  totalAreas: number
  averageResponseTime: number
  updateTime: string
}

export function getHeatmapData() {
  return get<HeatmapData>('/heatmap')
}

export function getAreaDetails(areaId?: string) {
  return get<AreaDetail[]>('/heatmap/areas', { params: { areaId } })
}
