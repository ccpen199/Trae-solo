import { Home, Package, Truck, FileCheck, Bot, Map, FileText, Calculator, Shield, BarChart3, Settings } from 'lucide-react'
import type { UserRole } from '../types'

export interface NavItem {
  key: string
  label: string
  icon: typeof Home
  path: string
  roles: UserRole[]
}

export const navItems: NavItem[] = [
  { key: 'dashboard', label: '工作台', icon: BarChart3, path: '/', roles: ['shipper', 'carrier', 'operator'] },
  { key: 'orders', label: '运输订单', icon: Package, path: '/orders', roles: ['shipper', 'carrier', 'operator'] },
  { key: 'capacity', label: '运力资源', icon: Truck, path: '/capacity', roles: ['carrier', 'operator'] },
  { key: 'qualification', label: '资质审核', icon: FileCheck, path: '/qualification', roles: ['operator'] },
  { key: 'matching', label: '智能匹配', icon: Bot, path: '/matching', roles: ['shipper', 'operator'] },
  { key: 'tracking', label: '在途可视化', icon: Map, path: '/tracking', roles: ['shipper', 'carrier', 'operator'] },
  { key: 'contracts', label: '合同与运单', icon: FileText, path: '/contracts', roles: ['shipper', 'carrier', 'operator'] },
  { key: 'settlement', label: '对账中心', icon: Calculator, path: '/settlement', roles: ['shipper', 'carrier', 'operator'] },
  { key: 'risk', label: '风控中心', icon: Shield, path: '/risk', roles: ['operator'] },
  { key: 'settings', label: '系统设置', icon: Settings, path: '/settings', roles: ['operator'] },
]
