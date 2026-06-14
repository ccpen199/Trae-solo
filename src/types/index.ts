export interface TraceRecord {
  traceCode: string
  productName: string
  category: string
  origin: string
  batchNo: string
  blockchainHash: string
  blockHeight: number
  timestamp: string
  nodes: TraceNode[]
  inspections: Inspection[]
}

export interface TraceNode {
  id: string
  stage: 'production' | 'processing' | 'logistics' | 'wholesale' | 'retail'
  operator: string
  location: string
  timestamp: string
  details: Record<string, unknown>
}

export interface Inspection {
  id: string
  type: string
  result: 'passed' | 'failed' | 'pending'
  reportUrl: string
  date: string
}

export interface SupplyDemand {
  id: string
  type: 'supply' | 'demand'
  category: string
  productName: string
  specification: string
  quantity: string
  price: number
  region: string
  publisher: string
  publishDate: string
  matchScore?: number
}

export interface ShopInfo {
  id: string
  name: string
  logo: string
  description: string
  rating: number
  deposit: number
  products: Product[]
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  traceCode: string
  images: string[]
}

export interface Contract {
  id: string
  title: string
  parties: string[]
  status: 'draft' | 'signing' | 'signed' | 'fulfilling' | 'completed' | 'disputed'
  amount: number
  createDate: string
  signDate?: string
  terms: string[]
}

export interface QATicket {
  id: string
  title: string
  description: string
  images?: string[]
  status: 'pending' | 'assigned' | 'answered' | 'closed'
  category: string
  asker: string
  expert?: string
  answer?: string
  createDate: string
  answerDate?: string
  rating?: number
}

export interface PestDiagnosis {
  id: string
  imageUrl: string
  pestName: string
  confidence: number
  description: string
  treatment: string[]
  prevention: string[]
}

export interface WeatherAlert {
  id: string
  level: 'red' | 'orange' | 'yellow' | 'blue'
  type: string
  region: string
  description: string
  startTime: string
  endTime: string
  advice: string
}

export interface FarmPlot {
  id: string
  name: string
  area: number
  soilType: string
  crop: string
  location: { lat: number; lng: number }
  records: FarmRecord[]
}

export interface FarmRecord {
  date: string
  type: 'sowing' | 'fertilizing' | 'irrigating' | 'spraying' | 'harvesting'
  description: string
  inputs?: { name: string; amount: string }[]
}

export interface SupervisionData {
  totalBatches: number
  tracedBatches: number
  traceRate: number
  passRate: number
  violationRate: number
  categoryStats: { category: string; count: number; passRate: number }[]
  regionStats: { region: string; count: number; passRate: number }[]
  trendData: { month: string; passRate: number; violationCount: number }[]
}

export interface ProcessRecord {
  id: string
  batchNo: string
  productName: string
  sourceBatch: string
  steps: ProcessStep[]
  qualityChecks: QualityCheck[]
  outputBatch: string
  status: 'receiving' | 'processing' | 'quality_check' | 'completed'
}

export interface ProcessStep {
  id: string
  name: string
  description: string
  timestamp: string
  operator: string
  completed: boolean
}

export interface QualityCheck {
  id: string
  type: string
  result: 'passed' | 'failed' | 'pending'
  inspector: string
  date: string
  notes: string
}

export interface LogisticsOrder {
  id: string
  batchNo: string
  productName: string
  origin: string
  destination: string
  status: 'pending' | 'in_transit' | 'delivered' | 'exception'
  carrier: string
  vehicleNo: string
  startTime: string
  estimatedArrival: string
  currentLocation: { lat: number; lng: number; address: string }
  route: { lat: number; lng: number }[]
  tempData: { time: string; temp: number; humidity: number }[]
  alerts: LogisticsAlert[]
}

export interface LogisticsAlert {
  id: string
  type: 'temp_high' | 'temp_low' | 'humidity_high' | 'delay'
  message: string
  timestamp: string
  resolved: boolean
}
