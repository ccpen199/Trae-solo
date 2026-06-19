import {
  LayoutDashboard,
  Users,
  Package,
  Building2,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  Shield,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  QrCode,
  Share2,
  Database,
  Megaphone,
  FileCheck,
  Star,
  Award,
  AlertTriangle,
} from 'lucide-react'
import type { UserRole } from '@/store/auth'

export interface MenuItem {
  key: string
  label: string
  icon: typeof LayoutDashboard
  path: string
  badge?: string
}

export const getMenuByRole = (role: UserRole): MenuItem[] => {
  if (role === 'direct_seller') {
    return [
      { key: 'dashboard', label: '工作台', icon: LayoutDashboard, path: '/dashboard' },
      { key: 'qrcode', label: '我的展业码', icon: QrCode, path: '/qrcode' },
      { key: 'customers', label: '客户管理', icon: Users, path: '/customers', badge: '3' },
      { key: 'share', label: '内容分享', icon: Share2, path: '/share' },
      { key: 'products', label: '产品中心', icon: Package, path: '/products' },
      { key: 'stores', label: '生活馆服务', icon: Building2, path: '/stores' },
      { key: 'exams', label: '培训考试', icon: BookOpen, path: '/exams', badge: '新' },
      { key: 'ranking', label: '业绩排行', icon: Award, path: '/ranking' },
      { key: 'compliance', label: '合规中心', icon: Shield, path: '/compliance' },
    ]
  }

  if (role === 'store_owner') {
    return [
      { key: 'dashboard', label: '门店工作台', icon: LayoutDashboard, path: '/dashboard' },
      { key: 'appointments', label: '预约管理', icon: ClipboardCheck, path: '/appointments', badge: '8' },
      { key: 'services', label: '服务记录', icon: FileCheck, path: '/services' },
      { key: 'reviews', label: '客户评价', icon: Star, path: '/reviews' },
      { key: 'inventory', label: '门店库存', icon: Database, path: '/inventory' },
      { key: 'products', label: '产品目录', icon: Package, path: '/products' },
      { key: 'promotions', label: '促销活动', icon: Megaphone, path: '/promotions' },
      { key: 'compliance', label: '合规中心', icon: Shield, path: '/compliance' },
    ]
  }

  return [
    { key: 'dashboard', label: '总部仪表盘', icon: LayoutDashboard, path: '/dashboard' },
    { key: 'teams', label: '团队管理', icon: Users, path: '/teams' },
    { key: 'products', label: '产品全生命周期', icon: Package, path: '/products' },
    { key: 'inventory', label: '库存总览', icon: Database, path: '/inventory' },
    { key: 'promotions', label: '促销规则引擎', icon: Megaphone, path: '/promotions' },
    { key: 'stores', label: '生活馆网络', icon: Building2, path: '/stores' },
    { key: 'training', label: '培训题库', icon: BookOpen, path: '/training' },
    { key: 'ranking', label: '业绩排行榜', icon: TrendingUp, path: '/ranking' },
    { key: 'compliance', label: '合规风控', icon: Shield, path: '/compliance', badge: '告警' },
    { key: 'analytics', label: '数据看板', icon: AlertTriangle, path: '/analytics' },
  ]
}
