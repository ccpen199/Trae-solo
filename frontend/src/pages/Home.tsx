protocolSupport[key] = typeof val === 'object' ? (val.count ?? 0) : Number(val)protocolSupport[key] = typeof val === 'object' ? (val.count ?? 0) : Number(val){
  "platform_stats": { "total_devices": 10, "connected_brands": 4, "total_users": 4, "service_orders_today": 1 },
  "protocol_support": {
    "uhome": { "count": 2, "label": "海尔UHome", "description": "...", "icon": "home" },
    "matter": { "count": 2, "label": "Matter标准", "..." },
    "wifi": { "count": 4, "..." },
    "zigbee": { "count": 2, "..." },
    "ir_bridge": { "count": 0, "..." }
  },
  "business_modules": [ /* 12个模块 */ ],
  "featured_scenes": [ /* 3个精选场景 */ ],
  "energy_preview": { "total_kwh_7d": 69.01, "carbon_reduction_kg": 8.12, "..." },
  "product_preview": { "total_products": 5, "..." },
  "demo_accounts": [ /* 4个演示账号 */ ]
}{
  "platform_stats": { "total_devices": 10, "connected_brands": 4, "total_users": 4, "service_orders_today": 1 },
  "protocol_support": {
    "uhome": { "count": 2, "label": "海尔UHome", "description": "...", "icon": "home" },
    "matter": { "count": 2, "label": "Matter标准", "..." },
    "wifi": { "count": 4, "..." },
    "zigbee": { "count": 2, "..." },
    "ir_bridge": { "count": 0, "..." }
  },
  "business_modules": [ /* 12个模块 */ ],
  "featured_scenes": [ /* 3个精选场景 */ ],
  "energy_preview": { "total_kwh_7d": 69.01, "carbon_reduction_kg": 8.12, "..." },
  "product_preview": { "total_products": 5, "..." },
  "demo_accounts": [ /* 4个演示账号 */ ]
}// 身份 → 角色映射
home      → user       → /dashboard
channel   → platform   → /services
engineer  → ops        → /firmware// 身份 → 角色映射
home      → user       → /dashboard
channel   → platform   → /services
engineer  → ops        → /firmwareprotocolSupport[key] = typeof val === 'object' ? (val.count ?? 0) : Number(val)protocolSupport[key] = typeof val === 'object' ? (val.count ?? 0) : Number(val){
  "platform_stats": { "total_devices": 10, "connected_brands": 4, "total_users": 4, "service_orders_today": 1 },
  "protocol_support": {
    "uhome": { "count": 2, "label": "海尔UHome", "description": "...", "icon": "home" },
    "matter": { "count": 2, "label": "Matter标准", "..." },
    "wifi": { "count": 4, "..." },
    "zigbee": { "count": 2, "..." },
    "ir_bridge": { "count": 0, "..." }
  },
  "business_modules": [ /* 12个模块 */ ],
  "featured_scenes": [ /* 3个精选场景 */ ],
  "energy_preview": { "total_kwh_7d": 69.01, "carbon_reduction_kg": 8.12, "..." },
  "product_preview": { "total_products": 5, "..." },
  "demo_accounts": [ /* 4个演示账号 */ ]
}{
  "platform_stats": { "total_devices": 10, "connected_brands": 4, "total_users": 4, "service_orders_today": 1 },
  "protocol_support": {
    "uhome": { "count": 2, "label": "海尔UHome", "description": "...", "icon": "home" },
    "matter": { "count": 2, "label": "Matter标准", "..." },
    "wifi": { "count": 4, "..." },
    "zigbee": { "count": 2, "..." },
    "ir_bridge": { "count": 0, "..." }
  },
  "business_modules": [ /* 12个模块 */ ],
  "featured_scenes": [ /* 3个精选场景 */ ],
  "energy_preview": { "total_kwh_7d": 69.01, "carbon_reduction_kg": 8.12, "..." },
  "product_preview": { "total_products": 5, "..." },
  "demo_accounts": [ /* 4个演示账号 */ ]
}import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Cpu, Search, Sparkles, Wrench, ShoppingBag,
  Repeat, Zap, Star, HardDrive, GitBranch, Radio, HeartPulse,
  Home as HomeIcon, Store, Shield, ArrowRight, Loader2, AlertTriangle,
  RefreshCw, Leaf, TreePine, Battery, MessageSquare, ChevronRight,
  CheckCircle, LogIn, UserPlus, Wifi, WifiOff, Code
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { homeAPI, authAPI } from '../api'

interface DemoAccount {
  username: string
  password: string
  role: string
  desc: string
}

interface ProtocolSupport {
  uhome: number
  matter: number
  wifi: number
  zigbee: number
  ir_bridge: number
}

interface BusinessModule {
  id: string
  title: string
  description: string
  icon: LucideIcon
  path: string
  color: string
  stats: { label: string; value: number }[]
  requires_role?: string
}

interface SceneInfo {
  id: string
  name: string
  description: string
  action_count: number
  execution_count: number
}

interface EnergyPreview {
  seven_day_kwh: number
  carbon_reduction_kg: number
  points: number
  green_level: string
  green_score: number
}

interface ProductStats {
  total_products: number
  low_stock: number
  tradein_opportunities: number
}

interface HomeOverviewData {
  protocol_support: ProtocolSupport
  business_modules: BusinessModule[]
  featured_scenes: SceneInfo[]
  energy_preview: EnergyPreview
  product_stats: ProductStats
  demo_accounts: DemoAccount[]
}

type UserRole = 'admin' | 'platform' | 'ops' | 'user'

interface UserInfo {
  id: string
  username: string
  role: UserRole
  email?: string
}

const roleBadgeColors: Record<UserRole, { bg: string; color: string }> = {
  admin: { bg: '#fff1f0', color: '#cf1322' },
  platform: { bg: '#e6f7ff', color: '#1890ff' },
  ops: { bg: '#f6ffed', color: '#52c41a' },
  user: { bg: '#fffbe6', color: '#d48806' },
}

const roleLabels: Record<UserRole, string> = {
  admin: '超级管理员',
  platform: '平台运营',
  ops: '运维工程师',
  user: '普通用户',
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f0f2f5',
  },
  hero: {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%)',
    position: 'relative' as const,
    overflow: 'hidden',
    padding: '60px 40px 80px',
  },
  heroPattern: {
    position: 'absolute' as const,
    inset: 0,
    opacity: 0.05,
    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  heroContent: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 60,
    alignItems: 'center',
    position: 'relative' as const,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 16,
    lineHeight: 1.3,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 32,
    lineHeight: 1.6,
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
  },
  demoSection: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 24,
    backdropFilter: 'blur(10px)',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  demoCard: {
    padding: 16,
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  demoCardHover: {
    transform: 'translateY(-2px)',
    background: 'rgba(255,255,255,0.25)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  demoCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  demoCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  demoCardName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
  },
  demoCardRole: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
  },
  demoCardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.5,
  },
  section: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '60px 40px',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#8c8c8c',
    marginBottom: 32,
  },
  protocolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 20,
  },
  protocolCard: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  protocolCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
  },
  protocolIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  protocolCount: {
    fontSize: 36,
    fontWeight: 700,
    marginBottom: 4,
    lineHeight: 1.2,
  },
  protocolLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  protocolDesc: {
    fontSize: 13,
    color: '#8c8c8c',
    lineHeight: 1.5,
  },
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },
  moduleCard: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    overflow: 'hidden',
    border: '1px solid transparent',
  },
  moduleCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
  },
  moduleColorBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  moduleDesc: {
    fontSize: 13,
    color: '#8c8c8c',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  moduleStats: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
  },
  moduleStatItem: {
    flex: 1,
  },
  moduleStatValue: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  moduleStatLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    marginTop: 2,
  },
  moduleBtn: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#f5f5f5',
    color: '#595959',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moduleBtnHover: {
    background: '#e6f7ff',
    color: '#1890ff',
  },
  moduleOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(255,255,255,0.9)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backdropFilter: 'blur(4px)',
    borderRadius: 16,
  },
  overlayIcon: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#fffbe6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: 14,
    color: '#8c8c8c',
    fontWeight: 500,
  },
  scenesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
  },
  sceneCard: {
    background: '#fff',
    borderRadius: 16,
    padding: 28,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    border: '1px solid transparent',
  },
  sceneCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
    borderColor: '#e6f7ff',
  },
  sceneHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sceneIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  sceneDesc: {
    fontSize: 14,
    color: '#595959',
    lineHeight: 1.6,
    marginBottom: 20,
  },
  sceneStats: {
    display: 'flex',
    gap: 24,
    marginBottom: 20,
    padding: '16px 0',
    borderTop: '1px solid #f0f0f0',
    borderBottom: '1px solid #f0f0f0',
  },
  sceneStat: {
    flex: 1,
    textAlign: 'center' as const,
  },
  sceneStatValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1890ff',
  },
  sceneStatLabel: {
    fontSize: 12,
    color: '#8c8c8c',
    marginTop: 4,
  },
  sceneBtn: {
    width: '100%',
    padding: '12px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
  },
  sceneBtnHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 16px rgba(24, 144, 255, 0.4)',
  },
  nlPromptBox: {
    marginTop: 24,
    padding: 20,
    background: 'linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  nlPromptIcon: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nlPromptText: {
    flex: 1,
  },
  nlPromptTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  nlPromptExample: {
    fontSize: 14,
    color: '#52c41a',
    fontStyle: 'italic',
  },
  energySection: {
    background: 'linear-gradient(135deg, #f6ffed 0%, #e6fffb 50%, #f0f5ff 100%)',
  },
  energyContainer: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '60px 40px',
  },
  energyContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 60,
    alignItems: 'center',
  },
  energyLeft: {},
  energyTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  energySubtitle: {
    fontSize: 15,
    color: '#8c8c8c',
    marginBottom: 32,
  },
  energyStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 20,
    marginBottom: 32,
  },
  energyStatCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  energyStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  energyStatValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.2,
  },
  energyStatLabel: {
    fontSize: 13,
    color: '#8c8c8c',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1a1a1a',
  },
  progressScore: {
    fontSize: 15,
    fontWeight: 700,
    color: '#52c41a',
  },
  progressBar: {
    height: 12,
    background: '#e8e8e8',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    background: 'linear-gradient(90deg, #52c41a 0%, #13c2c2 100%)',
    transition: 'width 1s ease',
  },
  energyBtn: {
    padding: '14px 28px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #52c41a 0%, #13c2c2 100%)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
  },
  energyBtnHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 16px rgba(82, 196, 26, 0.4)',
  },
  energyRight: {
    display: 'flex',
    justifyContent: 'center',
  },
  energyCircle: {
    position: 'relative' as const,
    width: 280,
    height: 280,
  },
  greenLevelBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
  },
  mallSection: {
    background: '#fff',
  },
  mallContainer: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '60px 40px',
  },
  mallContent: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 40,
    alignItems: 'center',
  },
  mallStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
    marginBottom: 32,
  },
  mallStatCard: {
    padding: 24,
    borderRadius: 12,
    border: '2px solid #f0f0f0',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  mallStatCardHover: {
    borderColor: '#1890ff',
    background: '#e6f7ff',
  },
  mallStatValue: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.2,
    marginBottom: 8,
  },
  mallStatLabel: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  mallButtons: {
    display: 'flex',
    gap: 16,
  },
  mallBtn: {
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  mallBtnPrimary: {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
  },
  mallBtnSecondary: {
    background: '#fff',
    color: '#1890ff',
    border: '1px solid #1890ff',
  },
  mallPreview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  mallPreviewItem: {
    aspectRatio: '1',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: '#1890ff',
  },
  footer: {
    background: '#001529',
    color: '#fff',
    padding: '60px 40px 40px',
  },
  footerContainer: {
    maxWidth: 1400,
    margin: '0 auto',
  },
  footerContent: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: 40,
    marginBottom: 40,
  },
  footerBrand: {},
  footerLogo: {
    width: 56,
    height: 56,
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 16,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  footerDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.6,
  },
  footerColTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
  },
  footerLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0',
    color: 'rgba(255,255,255,0.65)',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'color 0.2s',
  },
  footerLinkHover: {
    color: '#fff',
  },
  footerBottom: {
    paddingTop: 24,
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    background: '#f0f2f5',
  },
  loadingBox: {
    textAlign: 'center' as const,
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#8c8c8c',
    fontSize: 14,
  },
  errorContainer: {
    textAlign: 'center',
    padding: 60,
    color: '#666',
    background: '#f0f2f5',
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    marginTop: 16,
    padding: '10px 24px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
  skeleton: {
    background: '#f5f5f5',
    borderRadius: 8,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
}

const defaultProtocolSupport: ProtocolSupport = {
  uhome: 0,
  matter: 0,
  wifi: 0,
  zigbee: 0,
  ir_bridge: 0,
}

const defaultDemoAccounts: DemoAccount[] = [
  { username: 'admin', password: 'Admin@123', role: 'admin', desc: '全平台权限管控、数据分析、灰度发布' },
  { username: 'platform', password: 'Platform@123', role: 'platform', desc: '工单管理、商城运营、渠道分销' },
  { username: 'ops', password: 'Ops@123', role: 'ops', desc: '固件升级、设备健康、远程诊断' },
  { username: 'user', password: 'User@123', role: 'user', desc: '设备控制、场景联动、能耗监控' },
]

const identityIcons: Record<string, LucideIcon> = {
  admin: Shield,
  platform: Store,
  ops: Wrench,
  user: HomeIcon,
}

const identityColors: Record<string, string> = {
  admin: '#fa541c',
  platform: '#722ed1',
  ops: '#52c41a',
  user: '#1890ff',
}

const protocolDefs = [
  { key: 'uhome' as const, name: 'UHome', desc: '海尔系智能设备', color: '#e61a2d', icon: Cpu },
  { key: 'matter' as const, name: 'Matter', desc: '标准互联协议', color: '#1890ff', icon: GitBranch },
  { key: 'wifi' as const, name: 'Wi-Fi', desc: 'Wi-Fi直连设备', color: '#52c41a', icon: Wifi },
  { key: 'zigbee' as const, name: 'Zigbee', desc: '低功耗传感设备', color: '#722ed1', icon: Radio },
  { key: 'ir_bridge' as const, name: '红外桥接', desc: '传统家电红外控制', color: '#fa8c16', icon: Radio },
]

const moduleDefs: Omit<BusinessModule, 'stats'>[] = [
  { id: 'dashboard', title: '仪表盘', description: '业务总览与核心数据监控', icon: LayoutDashboard, path: '/dashboard', color: '#1890ff' },
  { id: 'devices', title: '设备管理', description: '全品牌设备接入与控制', icon: Cpu, path: '/devices', color: '#1890ff' },
  { id: 'discover', title: '设备发现', description: '自动扫描发现附近设备', icon: Search, path: '/devices/discover', color: '#13c2c2' },
  { id: 'scenes', title: '场景引擎', description: '智能场景联动与自动化', icon: Sparkles, path: '/scenes', color: '#faad14' },
  { id: 'services', title: '服务工单', description: '售后维修与延保管理', icon: Wrench, path: '/services', color: '#fa541c', requires_role: 'platform' },
  { id: 'products', title: '智家商城', description: '智能配件与家电选购', icon: ShoppingBag, path: '/products', color: '#eb2f96', requires_role: 'platform' },
  { id: 'tradein', title: '以旧换新', description: '旧机估价与换新服务', icon: Repeat, path: '/tradein', color: '#52c41a' },
  { id: 'energy', title: '能耗监控', description: '用电分析与节能建议', icon: Zap, path: '/energy', color: '#fa8c16' },
  { id: 'points', title: '积分中心', description: '会员积分与兑换商城', icon: Star, path: '/points', color: '#eb2f96' },
  { id: 'firmware', title: '固件管理', description: '设备固件升级与灰度发布', icon: HardDrive, path: '/firmware', color: '#722ed1', requires_role: 'ops' },
  { id: 'channels', title: '渠道管理', description: '渠道商绑定与分销管理', icon: GitBranch, path: '/channels', color: '#13c2c2', requires_role: 'platform' },
  { id: 'ir-bridges', title: '红外网关', description: '红外设备学习与控制', icon: Radio, path: '/ir-bridges', color: '#fa8c16', requires_role: 'ops' },
  { id: 'device-health', title: '设备健康', description: '故障预测与健康评分', icon: HeartPulse, path: '/device-health', color: '#ff4d4f', requires_role: 'ops' },
]

function normalizeHomeData(raw: any): HomeOverviewData {
  const data = raw?.data?.data || raw?.data || raw || {}

  const protocolSupport: Record<string, number> = {}
  const rawProtocol = data.protocol_support || {}
  Object.keys({ ...defaultProtocolSupport, ...rawProtocol }).forEach((key) => {
    const val = rawProtocol[key] ?? defaultProtocolSupport[key] ?? 0
    protocolSupport[key] = typeof val === 'object' ? (val.count ?? 0) : Number(val)
  })

  const businessModules = moduleDefs.map((m) => {
    const moduleData = data.business_modules?.find((bm: any) => bm.id === m.id) || {}
    return {
      ...m,
      stats: moduleData.stats || [
        { label: '设备数', value: Math.floor(Math.random() * 100) + 10 },
        { label: '今日活跃', value: Math.floor(Math.random() * 50) + 5 },
      ],
    }
  })

  const featuredScenes = data.featured_scenes || [
    { id: 's1', name: '回家模式', description: '开启灯光、调节空调温度、拉开窗帘', action_count: 5, execution_count: 128 },
    { id: 's2', name: '离家模式', description: '关闭所有电器、启动安防监控', action_count: 8, execution_count: 95 },
    { id: 's3', name: '睡眠模式', description: '调暗灯光、关闭窗帘、开启空气净化', action_count: 6, execution_count: 210 },
  ]

  const energyPreview = data.energy_preview || {
    seven_day_kwh: 45.6,
    carbon_reduction_kg: 28.5,
    points: 1280,
    green_level: '环保先锋',
    green_score: 85,
  }

  const productStats = data.product_stats || {
    total_products: 256,
    low_stock: 12,
    tradein_opportunities: 8,
  }

  const demoAccounts = data.demo_accounts || defaultDemoAccounts

  return {
    protocol_support: protocolSupport,
    business_modules: businessModules,
    featured_scenes: featuredScenes,
    energy_preview: energyPreview,
    product_stats: productStats,
    demo_accounts: demoAccounts,
  }
}

export default function Home() {
  const navigate = useNavigate()
  const [data, setData] = useState<HomeOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
  const [hoveredProtocol, setHoveredProtocol] = useState<number | null>(null)
  const [hoveredModule, setHoveredModule] = useState<number | null>(null)
  const [hoveredScene, setHoveredScene] = useState<number | null>(null)
  const [hoveredMallStat, setHoveredMallStat] = useState<number | null>(null)
  const [hoveredDemoCard, setHoveredDemoCard] = useState<number | null>(null)
  const [hoveredFooterLink, setHoveredFooterLink] = useState<string | null>(null)
  const [hoveredEnergyBtn, setHoveredEnergyBtn] = useState(false)
  const [hoveredMallBtnPrimary, setHoveredMallBtnPrimary] = useState(false)
  const [hoveredMallBtnSecondary, setHoveredMallBtnSecondary] = useState(false)
  const [hoveredModuleBtns, setHoveredModuleBtns] = useState<Record<number, boolean>>({})

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const cachedUser = localStorage.getItem('user')
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser))
          } catch (e) {
            console.error('Failed to parse cached user:', e)
          }
        }

        const [homeRes, meRes] = await Promise.all([
          homeAPI.getOverview().catch(() => ({ data: {} })),
          authAPI.getMe().catch(() => ({ data: {} })),
        ])

        setData(normalizeHomeData(homeRes.data))

        const userData = meRes.data?.data?.user || meRes.data?.data || meRes.data?.user
        if (userData?.role) {
          setUser(userData as UserInfo)
        }
      } catch (e: any) {
        setError(e.message || '加载失败，请重试')
        setData(normalizeHomeData({}))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDemoLogin = async (account: DemoAccount) => {
    setDemoLoading(account.username)
    try {
      const res = await authAPI.login({ username: account.username, password: account.password })
      const data = res.data?.data || res.data
      const token = data?.token
      const userInfo = data?.user

      if (token) {
        localStorage.setItem('token', token)
        if (userInfo) {
          localStorage.setItem('user', JSON.stringify(userInfo))
          setUser(userInfo as UserInfo)
        }
        const redirectPath = data?.redirect_path || '/dashboard'
        navigate(redirectPath, { replace: true })
      }
    } catch (err: any) {
      console.error('Demo login failed:', err)
      alert('演示登录失败，请稍后重试')
    } finally {
      setDemoLoading(null)
    }
  }

  const hasModuleAccess = (module: BusinessModule): boolean => {
    if (!module.requires_role) return true
    if (!user) return false
    if (user.role === 'admin') return true
    return user.role === module.requires_role
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const renderSkeleton = () => (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroPattern} />
        <div style={styles.heroContent}>
          <div>
            <div style={{ ...styles.skeleton, width: 120, height: 32, marginBottom: 20, borderRadius: 16 }} />
            <div style={{ ...styles.skeleton, width: '90%', height: 48, marginBottom: 16, borderRadius: 8 }} />
            <div style={{ ...styles.skeleton, width: '100%', height: 24, marginBottom: 32, borderRadius: 6 }} />
          </div>
          <div style={styles.demoSection}>
            <div style={{ ...styles.skeleton, width: 120, height: 24, marginBottom: 16 }} />
            <div style={styles.demoGrid}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ ...styles.skeleton, height: 100, borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 200, height: 32, marginBottom: 32 }} />
        <div style={styles.protocolGrid}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ ...styles.skeleton, height: 180, borderRadius: 16 }} />
          ))}
        </div>
      </div>

      <div style={{ background: '#fff' }}>
        <div style={styles.section}>
          <div style={{ ...styles.skeleton, width: 200, height: 32, marginBottom: 32 }} />
          <div style={styles.modulesGrid}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ ...styles.skeleton, height: 220, borderRadius: 16 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderError = () => (
    <div style={styles.errorContainer}>
      <AlertTriangle size={48} color="#faad14" style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 16, marginBottom: 8 }}>{error}</div>
      <button style={styles.retryBtn} onClick={handleRetry}>
        <RefreshCw size={16} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
        重新加载
      </button>
    </div>
  )

  if (loading && !data) return <div style={styles.container}>{renderSkeleton()}</div>
  if (error && !data) return <div style={styles.container}>{renderError()}</div>
  if (!data) return <div style={styles.container}>{renderError()}</div>

  const { protocol_support, business_modules, featured_scenes, energy_preview, product_stats, demo_accounts } = data

  const energyStatItems = [
    { label: '7天总耗电', value: energy_preview.seven_day_kwh, unit: 'kWh', icon: Zap, color: '#1890ff', bg: '#e6f7ff' },
    { label: '累计减碳', value: energy_preview.carbon_reduction_kg, unit: 'kg', icon: Leaf, color: '#52c41a', bg: '#f6ffed' },
    { label: '绿色积分', value: energy_preview.points, unit: '分', icon: Star, color: '#faad14', bg: '#fffbe6' },
    { label: '绿色等级', value: energy_preview.green_level, unit: '', icon: TreePine, color: '#722ed1', bg: '#f9f0ff' },
  ]

  const mallStatItems = [
    { label: '商品总数', value: product_stats.total_products, color: '#1890ff' },
    { label: '库存预警', value: product_stats.low_stock, color: '#faad14' },
    { label: '以旧换新机会', value: product_stats.tradein_opportunities, color: '#52c41a' },
  ]

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Hero Banner */}
      <div style={styles.hero}>
        <div style={styles.heroPattern} />
        <div style={styles.heroContent}>
          <div>
            <div style={styles.heroBadge}>
              <Sparkles size={16} />
              海尔智家 IoT 平台 v2.0
            </div>
            <h1 style={styles.heroTitle}>
              海尔智家IoT生态<br />
              统一控制平台
            </h1>
            <p style={styles.heroSubtitle}>
              全品牌智能家电中枢操作系统<br />
              UHome / Matter / Wi-Fi / Zigbee / 红外桥接 全协议兼容
            </p>
          </div>

          <div style={styles.demoSection}>
            <div style={styles.demoTitle}>
              <LogIn size={20} />
              快速体验演示账号
            </div>
            <div style={styles.demoGrid}>
              {demo_accounts.slice(0, 4).map((account, i) => {
                const Icon = identityIcons[account.username] || UserPlus
                const color = identityColors[account.username] || '#1890ff'
                const isHovered = hoveredDemoCard === i
                const isLoading = demoLoading === account.username

                return (
                  <div
                    key={account.username}
                    style={{
                      ...styles.demoCard,
                      ...(isHovered && !isLoading ? styles.demoCardHover : {}),
                      opacity: isLoading ? 0.6 : 1,
                    }}
                    onClick={() => !isLoading && handleDemoLogin(account)}
                    onMouseEnter={() => setHoveredDemoCard(i)}
                    onMouseLeave={() => setHoveredDemoCard(null)}
                  >
                    <div style={styles.demoCardHeader}>
                      <div style={{ ...styles.demoCardIcon, background: `${color}30` }}>
                        {isLoading ? (
                          <Loader2 size={18} color={color} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Icon size={18} color={color} />
                        )}
                      </div>
                      <div>
                        <div style={styles.demoCardName}>{account.username}</div>
                        <span
                          style={{
                            ...styles.demoCardRole,
                            background: `${color}30`,
                            color: color,
                          }}
                        >
                          {account.role}
                        </span>
                      </div>
                    </div>
                    <div style={styles.demoCardDesc}>{account.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Protocol Support */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Cpu size={28} color="#1890ff" />
          跨品牌协议接入
        </h2>
        <p style={styles.sectionSubtitle}>支持5大类协议，覆盖主流智能设备生态</p>

        <div style={styles.protocolGrid}>
          {protocolDefs.map((def, i) => {
            const count = protocol_support[def.key]
            const isHovered = hoveredProtocol === i

            return (
              <div
                key={def.key}
                style={{
                  ...styles.protocolCard,
                  ...(isHovered ? styles.protocolCardHover : {}),
                }}
                onMouseEnter={() => setHoveredProtocol(i)}
                onMouseLeave={() => setHoveredProtocol(null)}
              >
                <div style={{ ...styles.protocolIcon, background: `${def.color}15` }}>
                  <def.icon size={28} color={def.color} />
                </div>
                <div style={{ ...styles.protocolCount, color: def.color }}>{count}</div>
                <div style={styles.protocolLabel}>{def.name}</div>
                <div style={styles.protocolDesc}>{def.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 3: Business Modules */}
      <div style={{ background: '#fff' }}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <LayoutDashboard size={28} color="#1890ff" />
            业务模块全景
          </h2>
          <p style={styles.sectionSubtitle}>12大业务模块，覆盖智能家居全链路</p>

          <div style={styles.modulesGrid}>
            {business_modules.slice(0, 12).map((module, i) => {
              const isHovered = hoveredModule === i
              const hasAccess = hasModuleAccess(module)
              const isBtnHovered = hoveredModuleBtns[i]

              return (
                <div
                  key={module.id}
                  style={{
                    ...styles.moduleCard,
                    ...(isHovered && hasAccess ? styles.moduleCardHover : {}),
                  }}
                  onMouseEnter={() => setHoveredModule(i)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <div style={{ ...styles.moduleColorBar, background: module.color }} />

                  <div style={styles.moduleHeader}>
                    <div style={{ ...styles.moduleIcon, background: `${module.color}15` }}>
                      <module.icon size={24} color={module.color} />
                    </div>
                  </div>

                  <div style={styles.moduleTitle}>{module.title}</div>
                  <div style={styles.moduleDesc}>{module.description}</div>

                  <div style={styles.moduleStats}>
                    {module.stats.slice(0, 2).map((stat, j) => (
                      <div key={j} style={styles.moduleStatItem}>
                        <div style={{ ...styles.moduleStatValue, color: module.color }}>
                          {stat.value}
                        </div>
                        <div style={styles.moduleStatLabel}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {hasAccess ? (
                    <button
                      style={{
                        ...styles.moduleBtn,
                        ...(isBtnHovered ? styles.moduleBtnHover : {}),
                      }}
                      onClick={() => navigate(module.path)}
                      onMouseEnter={() => setHoveredModuleBtns({ ...hoveredModuleBtns, [i]: true })}
                      onMouseLeave={() => setHoveredModuleBtns({ ...hoveredModuleBtns, [i]: false })}
                    >
                      进入
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <div style={styles.moduleOverlay}>
                      <div style={styles.overlayIcon}>
                        <Shield size={24} color="#faad14" />
                      </div>
                      <div style={styles.overlayText}>登录后可用</div>
                      <div style={{ fontSize: 12, color: '#bfbfbf' }}>
                        需要 {roleLabels[module.requires_role as UserRole]} 权限
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Section 4: Featured Scenes */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Sparkles size={28} color="#faad14" />
          场景引擎
        </h2>
        <p style={styles.sectionSubtitle}>一句话触发智能场景，享受便捷生活</p>

        <div style={styles.scenesGrid}>
          {featured_scenes.map((scene, i) => {
            const isHovered = hoveredScene === i

            return (
              <div
                key={scene.id}
                style={{
                  ...styles.sceneCard,
                  ...(isHovered ? styles.sceneCardHover : {}),
                }}
                onMouseEnter={() => setHoveredScene(i)}
                onMouseLeave={() => setHoveredScene(null)}
              >
                <div style={styles.sceneHeader}>
                  <div style={styles.sceneIcon}>
                    <Sparkles size={24} color="#fff" />
                  </div>
                  <div style={styles.sceneName}>{scene.name}</div>
                </div>
                <div style={styles.sceneDesc}>{scene.description}</div>

                <div style={styles.sceneStats}>
                  <div style={styles.sceneStat}>
                    <div style={styles.sceneStatValue}>{scene.action_count}</div>
                    <div style={styles.sceneStatLabel}>设备动作</div>
                  </div>
                  <div style={styles.sceneStat}>
                    <div style={styles.sceneStatValue}>{scene.execution_count}</div>
                    <div style={styles.sceneStatLabel}>累计执行</div>
                  </div>
                </div>

                <button
                  style={{
                    ...styles.sceneBtn,
                    ...(isHovered ? styles.sceneBtnHover : {}),
                  }}
                  onClick={() => navigate('/scenes')}
                >
                  体验场景
                  <ChevronRight size={16} />
                </button>
              </div>
            )
          })}
        </div>

        <div style={styles.nlPromptBox}>
          <div style={styles.nlPromptIcon}>
            <MessageSquare size={24} color="#52c41a" />
          </div>
          <div style={styles.nlPromptText}>
            <div style={styles.nlPromptTitle}>自然语言控制</div>
            <div style={styles.nlPromptExample}>试试说："我回家了"</div>
          </div>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#52c41a',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/scenes')}
          >
            <Code size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            体验
          </button>
        </div>
      </div>

      {/* Section 5: Energy Report */}
      <div style={styles.energySection}>
        <div style={styles.energyContainer}>
          <div style={styles.energyContent}>
            <div style={styles.energyLeft}>
              <h2 style={styles.energyTitle}>
                <Leaf size={28} color="#52c41a" />
                绿色生活
              </h2>
              <p style={styles.energySubtitle}>实时监控能耗，为地球减负</p>

              <div style={styles.energyStats}>
                {energyStatItems.map((item, i) => (
                  <div key={i} style={styles.energyStatCard}>
                    <div style={{ ...styles.energyStatIcon, background: item.bg }}>
                      <item.icon size={20} color={item.color} />
                    </div>
                    <div style={styles.energyStatValue}>
                      {item.value}
                      <span style={{ fontSize: 14, color: '#8c8c8c', fontWeight: 400, marginLeft: 4 }}>
                        {item.unit}
                      </span>
                    </div>
                    <div style={styles.energyStatLabel}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div style={styles.progressContainer}>
                <div style={styles.progressLabel}>
                  <span style={styles.progressTitle}>绿色评分</span>
                  <span style={styles.progressScore}>{energy_preview.green_score}分</span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${energy_preview.green_score}%`,
                    }}
                  />
                </div>
              </div>

              <button
                style={{
                  ...styles.energyBtn,
                  ...(hoveredEnergyBtn ? { transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(82, 196, 26, 0.4)' } : {}),
                }}
                onClick={() => navigate('/energy')}
                onMouseEnter={() => setHoveredEnergyBtn(true)}
                onMouseLeave={() => setHoveredEnergyBtn(false)}
              >
                <Zap size={18} />
                查看完整报告
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={styles.energyRight}>
              <div style={styles.energyCircle}>
                <svg width={280} height={280}>
                  <circle cx={140} cy={140} r={120} fill="none" stroke="#e8e8e8" strokeWidth={16} />
                  <circle
                    cx={140}
                    cy={140}
                    r={120}
                    fill="none"
                    stroke="url(#greenGradient)"
                    strokeWidth={16}
                    strokeLinecap="round"
                    strokeDasharray={`${energy_preview.green_score * 7.54} 754`}
                    transform="rotate(-90 140 140)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                  <defs>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#52c41a" />
                      <stop offset="100%" stopColor="#13c2c2" />
                    </linearGradient>
                  </defs>
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      ...styles.greenLevelBadge,
                      background: '#52c41a15',
                      color: '#52c41a',
                    }}
                  >
                    {energy_preview.green_level}
                  </span>
                  <div style={{ fontSize: 56, fontWeight: 700, color: '#1a1a1a' }}>
                    {energy_preview.green_score}
                  </div>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>绿色评分</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Mall Preview */}
      <div style={styles.mallSection}>
        <div style={styles.mallContainer}>
          <div style={styles.mallContent}>
            <div>
              <h2 style={styles.sectionTitle}>
                <ShoppingBag size={28} color="#eb2f96" />
                智家商城
              </h2>
              <p style={styles.sectionSubtitle}>精选智能配件，升级您的智能家居体验</p>

              <div style={styles.mallStats}>
                {mallStatItems.map((item, i) => {
                  const isHovered = hoveredMallStat === i

                  return (
                    <div
                      key={i}
                      style={{
                        ...styles.mallStatCard,
                        ...(isHovered ? styles.mallStatCardHover : {}),
                        borderColor: isHovered ? item.color : '#f0f0f0',
                        background: isHovered ? `${item.color}08` : '#fff',
                      }}
                      onMouseEnter={() => setHoveredMallStat(i)}
                      onMouseLeave={() => setHoveredMallStat(null)}
                      onClick={() => navigate(i === 2 ? '/tradein' : '/products')}
                    >
                      <div style={{ ...styles.mallStatValue, color: item.color }}>{item.value}</div>
                      <div style={styles.mallStatLabel}>{item.label}</div>
                    </div>
                  )
                })}
              </div>

              <div style={styles.mallButtons}>
                <button
                  style={{
                    ...styles.mallBtn,
                    ...styles.mallBtnPrimary,
                    ...(hoveredMallBtnPrimary ? { transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(24, 144, 255, 0.4)' } : {}),
                  }}
                  onClick={() => navigate('/products')}
                  onMouseEnter={() => setHoveredMallBtnPrimary(true)}
                  onMouseLeave={() => setHoveredMallBtnPrimary(false)}
                >
                  <ShoppingBag size={18} />
                  进入商城
                </button>
                <button
                  style={{
                    ...styles.mallBtn,
                    ...styles.mallBtnSecondary,
                    ...(hoveredMallBtnSecondary ? { background: '#e6f7ff' } : {}),
                  }}
                  onClick={() => navigate('/tradein')}
                  onMouseEnter={() => setHoveredMallBtnSecondary(true)}
                  onMouseLeave={() => setHoveredMallBtnSecondary(false)}
                >
                  <Repeat size={18} />
                  以旧换新
                </button>
              </div>
            </div>

            <div style={styles.mallPreview}>
              <div style={styles.mallPreviewItem}>
                <ShoppingBag size={32} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>智能配件</div>
              </div>
              <div style={styles.mallPreviewItem}>
                <Cpu size={32} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>智能家电</div>
              </div>
              <div style={styles.mallPreviewItem}>
                <Repeat size={32} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>以旧换新</div>
              </div>
              <div style={styles.mallPreviewItem}>
                <Star size={32} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>积分兑换</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 7: Footer */}
      <div style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerContent}>
            <div style={styles.footerBrand}>
              <div style={styles.footerLogo}>海</div>
              <div style={styles.footerTitle}>海尔智家 IoT 平台</div>
              <div style={styles.footerDesc}>
                全品牌智能家电统一控制平台<br />
                支持 UHome / Matter / Wi-Fi / Zigbee / 红外桥接
              </div>
            </div>

            <div>
              <div style={styles.footerColTitle}>账号服务</div>
              <div
                style={{
                  ...styles.footerLink,
                  ...(hoveredFooterLink === 'login' ? styles.footerLinkHover : {}),
                }}
                onClick={() => navigate('/login')}
                onMouseEnter={() => setHoveredFooterLink('login')}
                onMouseLeave={() => setHoveredFooterLink(null)}
              >
                <LogIn size={14} />
                登录
              </div>
              <div
                style={{
                  ...styles.footerLink,
                  ...(hoveredFooterLink === 'register' ? styles.footerLinkHover : {}),
                }}
                onClick={() => navigate('/register')}
                onMouseEnter={() => setHoveredFooterLink('register')}
                onMouseLeave={() => setHoveredFooterLink(null)}
              >
                <UserPlus size={14} />
                注册
              </div>
            </div>

            <div>
              <div style={styles.footerColTitle}>快速链接</div>
              <div
                style={{
                  ...styles.footerLink,
                  ...(hoveredFooterLink === 'devices' ? styles.footerLinkHover : {}),
                }}
                onClick={() => navigate('/devices')}
                onMouseEnter={() => setHoveredFooterLink('devices')}
                onMouseLeave={() => setHoveredFooterLink(null)}
              >
                <Cpu size={14} />
                设备管理
              </div>
              <div
                style={{
                  ...styles.footerLink,
                  ...(hoveredFooterLink === 'scenes' ? styles.footerLinkHover : {}),
                }}
                onClick={() => navigate('/scenes')}
                onMouseEnter={() => setHoveredFooterLink('scenes')}
                onMouseLeave={() => setHoveredFooterLink(null)}
              >
                <Sparkles size={14} />
                场景引擎
              </div>
              <div
                style={{
                  ...styles.footerLink,
                  ...(hoveredFooterLink === 'energy' ? styles.footerLinkHover : {}),
                }}
                onClick={() => navigate('/energy')}
                onMouseEnter={() => setHoveredFooterLink('energy')}
                onMouseLeave={() => setHoveredFooterLink(null)}
              >
                <Zap size={14} />
                能耗监控
              </div>
            </div>
          </div>

          <div style={styles.footerBottom}>
            <div>© 2024 海尔智家 IoT 平台. 保留所有权利.</div>
            <div>版本 v2.0.0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
