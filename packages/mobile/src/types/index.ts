export interface User {
  id: string
  phone: string
  nickname: string
  avatar?: string
  level: string
  balance: number
  points: number
}

export interface Station {
  id: string
  name: string
  address: string
  longitude: number
  latitude: number
  distance?: number
  price: number
  availableCount: number
  totalCount: number
  rating: number
  tags?: string[]
}

export interface ChargingPile {
  id: string
  stationId: string
  pileNo: string
  status: 'idle' | 'charging' | 'offline' | 'reserved'
  power: number
  type: string
}

export interface ChargingOrder {
  id: string
  stationId: string
  stationName: string
  pileNo: string
  startTime: string
  endTime?: string
  chargedPower: number
  totalPower: number
  amount: number
  status: 'charging' | 'completed' | 'cancelled'
}

export interface V2GStrategy {
  id: string
  name: string
  description: string
  enabled: boolean
  minBatteryLevel: number
  maxSellPrice: number
  type: 'arbitrage' | 'backup' | 'grid'
}

export interface RoutePlan {
  id: string
  departure: string
  destination: string
  totalDistance: number
  totalTime: number
  chargeStops: RouteChargeStop[]
  estimatedCost: number
}

export interface RouteChargeStop {
  stationId: string
  stationName: string
  distance: number
  chargeTime: number
  chargedPower: number
}
