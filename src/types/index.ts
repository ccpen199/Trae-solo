export type PortalMode = 'personal' | 'enterprise'

export interface MenuItem {
  key: string
  label: string
  icon: string
  path: string
  children?: MenuItem[]
}

export interface ServiceCard {
  id: string
  title: string
  description: string
  icon: string
  path: string
  color: string
  badge?: string
}

export interface InsuranceStatus {
  type: string
  status: 'normal' | 'suspended' | 'pending'
  base: number
  month: string
  company: string
}

export interface DataSource {
  id: string
  name: string
  status: 'online' | 'offline' | 'syncing'
  lastSync: string
  recordCount: number
  errorRate: number
}

export interface AlertItem {
  id: string
  type: 'timeout' | 'rejection' | 'hotspot' | 'conflict'
  title: string
  description: string
  time: string
  severity: 'high' | 'medium' | 'low'
}

export interface PolicyNode {
  id: string
  name: string
  category: string
  relations: string[]
}

export interface OCRResult {
  id: string
  fileName: string
  uploadTime: string
  status: 'processing' | 'completed' | 'failed'
  extractedFields: { key: string; value: string; confidence: number }[]
  reusableServices: string[]
}
