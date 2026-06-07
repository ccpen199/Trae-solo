import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Bar, Cell
} from 'recharts'
import {
  Cpu, Wifi, WifiOff, Radio, Sparkles, Wrench, Star, GitBranch,
  Zap, HeartPulse, HardDrive, ShoppingBag, Repeat, Shield, Search,
  MessageSquare, Code, CheckCircle, AlertCircle, XCircle, Clock,
  TrendingUp, TrendingDown, Minus, RefreshCw, ArrowRight, Loader2,
  ChevronRight, Leaf, TreePine, Battery, AlertTriangle
} from 'lucide-react'
import { dashboardAPI, sceneAPI, authAPI } from '../api'

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '8px 24px 24px', minHeight: '100vh' },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 8 },
  panelTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  cardsGrid4x2: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 8 },
  cardsGrid2x2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 8 },
  grid211: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 24 },
  grid21: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 },
  fullPanel: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 },
  panel: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.25s ease', border: '1px solid transparent' },
  cardHover: { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderColor: '#e6f7ff' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, color: '#8c8c8c', marginBottom: 6 },
  cardValue: { fontSize: 28, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 },
  cardExtra: { fontSize: 12, color: '#8c8c8c', marginTop: 8 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 },
  splitPanel: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  protocolItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #f0f0f0' },
  protocolIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  progressBar: { height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', flex: 1 },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width 0.5s ease' },
  skeleton: { background: '#f5f5f5', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' },
  sceneCard: { padding: '16px 20px', background: '#fafafa', borderRadius: 10, border: '1px solid #e8e8e8', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 12 },
  sceneCardActive: { background: '#e6f7ff', borderColor: '#91d5ff' },
  button: { padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8 },
  buttonPrimary: { background: '#1890ff', color: '#fff' },
  buttonDefault: { background: '#f5f5f5', color: '#333' },
  input: { padding: '10px 16px', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14, outline: 'none', width: '100%' },
  codeBlock: { background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, fontSize: 12, fontFamily: 'monospace', overflowX: 'auto' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', gap: 12, padding: '12px 16px', background: '#fafafa', borderRadius: 8, fontWeight: 600, color: '#666', fontSize: 13 },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', gap: 12, padding: '16px', borderBottom: '1px solid #f0f0f0', alignItems: 'center' },
  healthBar: { height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  quickEntryGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 16 },
  quickEntryCard: { padding: '16px', background: '#fafafa', borderRadius: 10, border: '1px solid #e8e8e8', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  executionResult: { background: '#fafafa', borderRadius: 10, padding: 16, marginTop: 16 },
  resultSuccess: { background: '#f6ffed', borderColor: '#b7eb8f' },
  resultWarning: { background: '#fffbe6', borderColor: '#ffe58f' },
  resultError: { background: '#fff1f0', borderColor: '#ffa39e' },
  spinner: { animation: 'spin 1s linear infinite' },
  errorContainer: { textAlign: 'center', padding: 60, color: '#666' },
  retryBtn: { marginTop: 16, padding: '10px 24px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  top5Item: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  deviceDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  recentItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', transition: 'background 0.2s' },
  nlInput: { display: 'flex', gap: 8, marginTop: 12 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' },
}

const deviceTypeColors: Record<string, string> = {
  '空调': '#1890ff',
  '冰箱': '#13c2c2',
  '洗衣机': '#722ed1',
  '电视': '#eb2f96',
  '热水器': '#fa8c16',
  '其他': '#8c8c8c',
}

const greenLevelBadges: Record<string, { color: string; bg: string }> = {
  '节能明星': { color: '#1890ff', bg: '#e6f7ff' },
  '环保先锋': { color: '#52c41a', bg: '#f6ffed' },
  '绿色达人': { color: '#722ed1', bg: '#f9f0ff' },
  '节能新手': { color: '#faad14', bg: '#fffbe6' },
}

const membershipLevels: Record<string, { color: string; bg: string }> = {
  '普通会员': { color: '#8c8c8c', bg: '#f5f5f5' },
  '银卡会员': { color: '#595959', bg: '#f0f0f0' },
  '金卡会员': { color: '#faad14', bg: '#fffbe6' },
  '钻石会员': { color: '#1890ff', bg: '#e6f7ff' },
}

interface DashboardData {
  overview: {
    total_devices: number
    online_devices: number
    offline_devices: number
    protocol_support: {
      ir_bridge: number
      wifi: number
      matter: number
      zigbee: number
      uhome: number
    }
    active_scenes: number
    pending_services: number
    points_balance: number
    membership_level: string
    channel_binding?: {
      bound_devices: number
      pending_approval: number
    }
    ir_bridge_online: number
    ir_codes_learned: number
    device_type_breakdown: {
      wifi: number
      matter: number
      zigbee: number
    }
  }
  protocol_access: {
    uhome: { count: number; total: number }
    matter: { count: number; total: number }
    wifi: { count: number; total: number }
    zigbee: { count: number; total: number }
    ir_bridge: { count: number; total: number }
  }
  discovery: {
    is_scanning: boolean
    last_scan_time: string
    devices_found: number
  }
  energy_trend: Array<{
    date: string
    kwh: number
    points_earned: number
  }>
  energy_summary: {
    total_kwh: number
    total_cost: number
    avg_daily_kwh: number
    percentile_rank: number
  }
  green_report: {
    green_score: number
    level: string
    carbon_reduction_kg: number
    trees_equivalent: number
  }
  top5_consumption: Array<{
    name: string
    type: string
    kwh: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }>
  quick_scenes: Array<{
    id: string
    name: string
    description: string
    action_count: number
  }>
  recent_executions: Array<{
    id: string
    scene_name: string
    executed_at: string
    status: 'success' | 'partial' | 'failed'
  }>
  recent_devices: Array<{
    id: string
    name: string
    brand: string
    status: 'online' | 'offline'
    health_score: number
    firmware_status: 'latest' | 'pending' | 'gray'
    service_status: 'normal' | 'pending' | 'expired'
    accessories_count: number
    tradein_value: number
  }>
  business_entries: {
    firmware_pending: number
    high_risk_devices: number
    pending_services: number
    warranty_expiring: number
    low_stock_accessories: number
    tradein_opportunities: number
  }
  channel_binding?: {
    bound_devices: number
    pending_approval: number
  }
}

interface SceneExecutionResult {
  status: 'success' | 'partial' | 'failed'
  duration_ms: number
  device_results: Array<{
    device_name: string
    status: 'success' | 'failed'
    error?: string
  }>
}

const defaultProtocolSupport = {
  uhome: 0,
  matter: 0,
  wifi: 0,
  zigbee: 0,
  ir_bridge: 0,
}

function normalizeDashboardData(raw: any): DashboardData {
  const normalizeProtocolValue = (val: any): number => {
    if (val == null) return 0
    if (typeof val === 'number') return val
    if (typeof val === 'object' && val !== null && 'count' in val) return Number(val.count || 0)
    return Number(val) || 0
  }

  if (raw?.protocol_access) {
    const ps = raw?.overview?.protocol_support || {}
    const normalizedPS: Record<string, number> = {}
    for (const [key, val] of Object.entries(ps)) {
      normalizedPS[key] = normalizeProtocolValue(val)
    }
    return {
      ...raw,
      overview: {
        ...raw.overview,
        protocol_support: { ...defaultProtocolSupport, ...normalizedPS },
        device_type_breakdown: {
          wifi: normalizedPS.wifi || 0,
          matter: normalizedPS.matter || 0,
          zigbee: normalizedPS.zigbee || 0,
        },
      },
    } as DashboardData
  }

  const overview = raw?.overview || {}
  const protocolSupport = { ...defaultProtocolSupport, ...(overview.protocol_support || {}) }
  const totalDevices = Number(overview.total_devices || 0)
  const channelBinding = overview.channel_binding

  const protocolAccess = Object.fromEntries(
    Object.entries(protocolSupport).map(([key, val]) => [
      key,
      { count: normalizeProtocolValue(val), total: totalDevices },
    ])
  ) as DashboardData['protocol_access']

  return {
    overview: {
      total_devices: totalDevices,
      online_devices: Number(overview.online_devices || 0),
      offline_devices: Number(overview.offline_devices || 0),
      protocol_support: protocolSupport,
      active_scenes: Number(overview.active_scenes || 0),
      pending_services: Number(overview.pending_services || 0),
      points_balance: Number(overview.points_balance || 0),
      membership_level: overview.membership_level || 'standard',
      channel_binding: channelBinding ? {
        bound_devices: Number(channelBinding.bound_devices || 0),
        pending_approval: Number(channelBinding.pending_approval ?? channelBinding.pending_approvals ?? 0),
      } : undefined,
      ir_bridge_online: Number(overview.ir_bridge_online ?? overview.ir_bridges?.online ?? 0),
      ir_codes_learned: Number(overview.ir_codes_learned ?? overview.ir_bridges?.learned_codes ?? 0),
      device_type_breakdown: {
        wifi: protocolSupport.wifi,
        matter: protocolSupport.matter,
        zigbee: protocolSupport.zigbee,
      },
    },
    protocol_access: protocolAccess,
    discovery: {
      is_scanning: Boolean(overview.discovery?.is_scanning ?? overview.discovery?.scanning),
      last_scan_time: overview.discovery?.last_scan_time || overview.discovery?.last_scan_at || '暂无扫描记录',
      devices_found: Number(overview.discovery?.devices_found || 0),
    },
    energy_trend: raw?.energy?.last7days || [],
    energy_summary: {
      total_kwh: Number(raw?.energy?.total_kwh || 0),
      total_cost: Number(raw?.energy?.total_cost || 0),
      avg_daily_kwh: Number(raw?.energy?.avg_daily ?? raw?.energy?.avg_daily_kwh ?? 0),
      percentile_rank: Number(raw?.energy?.rank_percentage ?? raw?.energy?.percentile_rank ?? 0),
    },
    green_report: {
      green_score: Number(raw?.energy?.green_report?.green_score || 0),
      level: raw?.energy?.green_report?.level || '节能新手',
      carbon_reduction_kg: Number(raw?.energy?.green_report?.carbon_reduction_kg || 0),
      trees_equivalent: Number(raw?.energy?.green_report?.trees_equivalent ?? raw?.energy?.green_report?.equivalent_trees ?? 0),
    },
    top5_consumption: raw?.energy?.device_breakdown || [],
    quick_scenes: raw?.scenes?.quick_scenes || [],
    recent_executions: (raw?.scenes?.recent_executions || []).map((item: any) => ({
      id: item.id,
      scene_name: item.scene_name,
      executed_at: item.executed_at,
      status: item.status || (item.success ? 'success' : 'failed'),
    })),
    recent_devices: (raw?.devices?.recent || []).map((device: any) => {
      const grayStatus = device.firmware?.gray_status
      const firmwareStatus = grayStatus === 'in_progress' || grayStatus === 'completed'
        ? 'gray'
        : device.firmware?.update_available || grayStatus === 'pending'
          ? 'pending'
          : 'latest'
      const serviceStatus = device.service?.warranty_expired
        ? 'expired'
        : device.service?.has_pending
          ? 'pending'
          : 'normal'

      return {
        id: String(device.id),
        name: device.name,
        brand: device.brand,
        status: device.status,
        health_score: Number(device.health_score || 0),
        firmware_status: firmwareStatus,
        service_status: serviceStatus,
        accessories_count: Number(device.related_products?.accessories_count || 0),
        tradein_value: Number(device.related_products?.tradein_value || 0),
      }
    }),
    business_entries: {
      firmware_pending: Number(raw?.devices?.business_links?.pending_firmware_updates || 0),
      high_risk_devices: Number(raw?.devices?.business_links?.high_risk_devices || 0),
      pending_services: Number(raw?.devices?.business_links?.pending_service_orders || 0),
      warranty_expiring: Number(raw?.devices?.business_links?.expiring_warranties || 0),
      low_stock_accessories: Number(raw?.devices?.business_links?.low_stock_accessories || 0),
      tradein_opportunities: Number(raw?.devices?.business_links?.tradein_opportunities || 0),
    },
    channel_binding: channelBinding ? {
      bound_devices: Number(channelBinding.bound_devices || 0),
      pending_approval: Number(channelBinding.pending_approval ?? channelBinding.pending_approvals ?? 0),
    } : undefined,
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [executingSceneId, setExecutingSceneId] = useState<string | null>(null)
  const [executionResult, setExecutionResult] = useState<SceneExecutionResult | null>(null)
  const [showNLInput, setShowNLInput] = useState(false)
  const [showGeekMode, setShowGeekMode] = useState(false)
  const [nlCommand, setNlCommand] = useState('')
  const [selectedExecution, setSelectedExecution] = useState<any>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [dashRes, meRes] = await Promise.all([
        dashboardAPI.getSummary(),
        authAPI.getMe().catch(() => ({ data: { role: 'user' } }))
      ])
      setData(normalizeDashboardData(dashRes.data?.data || dashRes.data))
      setUserRole(meRes.data?.data?.role || meRes.data?.role || 'user')
    } catch (e: any) {
      setError(e.message || '加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const isAdmin = userRole === 'platform' || userRole === 'admin'

  const handleSceneExecute = async (sceneId: string, sceneName: string) => {
    try {
      setExecutingSceneId(sceneId)
      setExecutionResult(null)
      const res = await sceneAPI.execute(sceneId)
      const result = res.data?.data || res.data
      setExecutionResult(result)
    } catch (e: any) {
      setExecutionResult({
        status: 'failed',
        duration_ms: 0,
        device_results: [{ device_name: sceneName, status: 'failed', error: e.message || '执行失败' }]
      })
    } finally {
      setExecutingSceneId(null)
    }
  }

  const handleRetryFailed = () => {
    if (executionResult) {
      const failedDevices = executionResult.device_results.filter(d => d.status === 'failed')
      alert(`即将重试 ${failedDevices.length} 个失败设备...`)
    }
  }

  const handleNlSubmit = () => {
    if (nlCommand.trim()) {
      alert(`正在执行自然语言指令: "${nlCommand}"`)
      setNlCommand('')
      setShowNLInput(false)
    }
  }

  const renderSkeleton = () => (
    <>
      <div style={styles.cardsGrid4x2}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ ...styles.card, cursor: 'default' }}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.skeleton, width: 44, height: 44, borderRadius: 12 }} />
            </div>
            <div style={{ ...styles.skeleton, height: 14, width: 60, marginBottom: 8 }} />
            <div style={{ ...styles.skeleton, height: 32, width: 80 }} />
          </div>
        ))}
      </div>

      <div style={{ ...styles.fullPanel, marginTop: 24 }}>
        <div style={{ ...styles.skeleton, height: 20, width: 200, marginBottom: 20 }} />
        <div style={styles.splitPanel}>
          {[...Array(2)].map((_, i) => (
            <div key={i}>
              {[...Array(5)].map((_, j) => (
                <div key={j} style={{ ...styles.skeleton, height: 40, marginBottom: 12 }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.grid211}>
        <div style={styles.panel}>
          <div style={{ ...styles.skeleton, height: 20, width: 150, marginBottom: 20 }} />
          <div style={{ ...styles.skeleton, height: 260, width: '100%' }} />
        </div>
        <div style={styles.panel}>
          <div style={{ ...styles.skeleton, height: 20, width: 120, marginBottom: 20 }} />
          <div style={{ ...styles.skeleton, height: 180, width: '100%' }} />
        </div>
        <div style={styles.panel}>
          <div style={{ ...styles.skeleton, height: 20, width: 150, marginBottom: 20 }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ ...styles.skeleton, height: 40, marginBottom: 10 }} />
          ))}
        </div>
      </div>
    </>
  )

  const renderError = () => (
    <div style={styles.errorContainer}>
      <AlertTriangle size={48} color="#faad14" style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 16, marginBottom: 8 }}>{error}</div>
      <button style={styles.retryBtn} onClick={fetchData}>
        <RefreshCw size={16} style={{ marginRight: 8 }} />
        重新加载
      </button>
    </div>
  )

  if (loading) return <div style={styles.container}>{renderSkeleton()}</div>
  if (error) return <div style={styles.container}>{renderError()}</div>
  if (!data) return <div style={styles.container}>{renderError()}</div>

  const { overview, protocol_access, discovery, energy_trend, energy_summary,
    green_report, top5_consumption, quick_scenes, recent_executions,
    recent_devices, business_entries, channel_binding } = data

  const overviewCards = [
    {
      label: '设备总数',
      value: overview.total_devices,
      icon: Cpu,
      color: '#1890ff',
      bg: '#e6f7ff',
      extra: `Wi-Fi ${overview.device_type_breakdown.wifi} / Matter ${overview.device_type_breakdown.matter} / Zigbee ${overview.device_type_breakdown.zigbee}`,
      onClick: () => navigate('/devices')
    },
    {
      label: '在线设备',
      value: overview.online_devices,
      icon: Wifi,
      color: '#52c41a',
      bg: '#f6ffed',
      onClick: () => navigate('/devices?status=online')
    },
    {
      label: '离线设备',
      value: overview.offline_devices,
      icon: WifiOff,
      color: '#ff4d4f',
      bg: '#fff1f0',
      onClick: () => navigate('/devices?status=offline')
    },
    {
      label: '红外桥接老机型',
      value: overview.protocol_support.ir_bridge,
      icon: Radio,
      color: '#722ed1',
      bg: '#f9f0ff',
      extra: `${overview.ir_bridge_online}个网关在线 / ${overview.ir_codes_learned}组红外码已学习`,
      onClick: () => navigate('/ir-bridges')
    },
    {
      label: '活跃场景',
      value: overview.active_scenes,
      icon: Sparkles,
      color: '#faad14',
      bg: '#fffbe6',
      onClick: () => navigate('/scenes')
    },
    {
      label: '待处理工单',
      value: overview.pending_services,
      icon: Wrench,
      color: '#fa541c',
      bg: '#fff2e8',
      onClick: () => navigate('/services?status=pending')
    },
    {
      label: '会员积分',
      value: overview.points_balance,
      icon: Star,
      color: '#eb2f96',
      bg: '#fff0f6',
      badge: overview.membership_level,
      onClick: () => navigate('/points')
    },
    ...(isAdmin && overview.channel_binding ? [{
      label: '渠道绑定设备',
      value: overview.channel_binding.bound_devices,
      icon: GitBranch,
      color: '#13c2c2',
      bg: '#e6fffb',
      onClick: () => navigate('/channels')
    }] : [])
  ]

  const protocolItems = [
    { name: 'UHome', count: protocol_access.uhome.count, total: protocol_access.uhome.total, desc: '海尔系设备', color: '#e61a2d', icon: Cpu },
    { name: 'Matter', count: protocol_access.matter.count, total: protocol_access.matter.total, desc: '标准互联设备', color: '#1890ff', icon: GitBranch },
    { name: 'Wi-Fi', count: protocol_access.wifi.count, total: protocol_access.wifi.total, desc: 'Wi-Fi直连设备', color: '#52c41a', icon: Wifi },
    { name: 'Zigbee', count: protocol_access.zigbee.count, total: protocol_access.zigbee.total, desc: 'Zigbee传感设备', color: '#722ed1', icon: Radio },
    { name: 'IR Bridge', count: protocol_access.ir_bridge.count, total: protocol_access.ir_bridge.total, desc: '红外桥接老机型', color: '#fa8c16', icon: Radio },
  ]

  const businessQuickEntries = [
    { label: '固件待更新', value: business_entries.firmware_pending, icon: HardDrive, color: '#1890ff', path: '/firmware' },
    { label: '高风险设备', value: business_entries.high_risk_devices, icon: AlertTriangle, color: '#fa541c', path: '/device-health' },
    { label: '待处理工单', value: business_entries.pending_services, icon: Wrench, color: '#faad14', path: '/services' },
    { label: '延保即将到期', value: business_entries.warranty_expiring, icon: Shield, color: '#722ed1', path: '/services' },
    { label: '配件库存不足', value: business_entries.low_stock_accessories, icon: ShoppingBag, color: '#eb2f96', path: '/products' },
    { label: '以旧换新机会', value: business_entries.tradein_opportunities, icon: Repeat, color: '#52c41a', path: '/tradein' },
  ]

  const geekModeExample = {
    scene_id: "scene_001",
    name: "回家模式",
    triggers: [{ type: "geofence", condition: "enter", location: "home" }],
    conditions: [{ type: "time_range", start: "17:00", end: "23:00" }],
    actions: [
      { device_id: "dev_001", capability: "on_off", value: true },
      { device_id: "dev_002", capability: "temperature", value: 24 },
      { device_id: "dev_003", capability: "brightness", value: 80 }
    ]
  }

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

      <div style={styles.sectionTitle}>
        <Cpu size={20} color="#1890ff" />
        业务总览
      </div>
      <div style={styles.cardsGrid4x2}>
        {overviewCards.map((card, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              ...(hoveredCard === i ? styles.cardHover : {})
            }}
            onClick={card.onClick}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, background: card.bg }}>
                <card.icon size={22} color={card.color} />
              </div>
              {card.badge && (
                <span style={{
                  ...styles.badge,
                  background: membershipLevels[card.badge]?.bg || '#f5f5f5',
                  color: membershipLevels[card.badge]?.color || '#8c8c8c'
                }}>
                  {card.badge}
                </span>
              )}
            </div>
            <div style={styles.cardLabel}>{card.label}</div>
            <div style={{ ...styles.cardValue, color: card.color }}>{card.value}</div>
            {card.extra && <div style={styles.cardExtra}>{card.extra}</div>}
          </div>
        ))}
      </div>

      <div style={styles.fullPanel}>
        <div style={{ ...styles.sectionTitle, margin: '0 0 20px 0' }}>
          <Zap size={20} color="#1890ff" />
          协议接入与设备发现状态
        </div>
        <div style={styles.splitPanel}>
          <div>
            <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              跨品牌协议接入状态
            </div>
            {protocolItems.map((item, i) => {
              const percent = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0
              return (
                <div key={i} style={styles.protocolItem}>
                  <div style={{ ...styles.protocolIcon, background: `${item.color}15` }}>
                    <item.icon size={20} color={item.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                        <span style={{ color: '#8c8c8c', fontSize: 13, marginLeft: 8 }}>
                          {item.count} {item.desc}
                        </span>
                      </div>
                      <span style={{ color: item.color, fontWeight: 600, fontSize: 13 }}>{percent}%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${percent}%`, background: item.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div>
            <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              设备发现状态
            </div>
            <div style={{ background: '#fafafa', borderRadius: 10, padding: 20, marginBottom: 16 }}>
              {discovery.is_scanning ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Loader2 size={32} color="#1890ff" style={styles.spinner} />
                  <div style={{ marginTop: 12, fontWeight: 500 }}>正在扫描...</div>
                  <div style={{ color: '#8c8c8c', fontSize: 13, marginTop: 4 }}>
                    已发现 {discovery.devices_found} 台设备
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <CheckCircle size={20} color="#52c41a" />
                    <span style={{ fontWeight: 500 }}>共发现 {discovery.devices_found} 台设备</span>
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 12 }}>
                    <Clock size={14} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
                    上次扫描: {discovery.last_scan_time}
                  </div>
                  <button
                    style={{ ...styles.button, ...styles.buttonPrimary, width: '100%', justifyContent: 'center' }}
                    onClick={() => navigate('/devices/discover')}
                  >
                    <Search size={16} />
                    立即扫描
                  </button>
                </div>
              )}
            </div>
            {isAdmin && channel_binding && (
              <div style={{ background: '#f0f5ff', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <GitBranch size={16} color="#1890ff" />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>渠道绑定状态</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#52c41a' }}>{channel_binding.bound_devices} 台设备已绑定渠道</span>
                  <span style={{ color: '#faad14' }}>{channel_binding.pending_approval} 个待审批</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.grid211}>
        <div style={styles.panel}>
          <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <Zap size={18} color="#1890ff" />
            近7天能耗趋势
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={energy_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                unit="kWh"
                tick={{ fill: '#1890ff' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                unit="积分"
                tick={{ fill: '#52c41a' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'kwh' ? '能耗 (kWh)' : '获得积分'
                ]}
              />
              <Legend formatter={(value) => value === 'kwh' ? '能耗 (kWh)' : '获得积分'} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="kwh"
                stroke="#1890ff"
                strokeWidth={3}
                dot={{ fill: '#1890ff', r: 4 }}
                activeDot={{ r: 6 }}
                name="kwh"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="points_earned"
                stroke="#52c41a"
                strokeWidth={3}
                dot={{ fill: '#52c41a', r: 4 }}
                activeDot={{ r: 6 }}
                name="points_earned"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>7天总kWh</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>{energy_summary.total_kwh}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>总电费</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>¥{energy_summary.total_cost}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>日均kWh</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{energy_summary.avg_daily_kwh}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>超过全国</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>{energy_summary.percentile_rank}% 用户</div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <Leaf size={18} color="#52c41a" />
            绿色生活报告
          </div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
              <svg width="140" height="140">
                <circle cx="70" cy="70" r="60" fill="none" stroke="#f0f0f0" strokeWidth="10" />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="#52c41a"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${green_report.green_score * 3.77} 377`}
                  transform="rotate(-90 70 70)"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 32,
                fontWeight: 700,
                color: '#52c41a'
              }}>
                {green_report.green_score}
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                ...styles.badge,
                background: greenLevelBadges[green_report.level]?.bg || '#f5f5f5',
                color: greenLevelBadges[green_report.level]?.color || '#8c8c8c'
              }}>
                {green_report.level}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <TreePine size={24} color="#52c41a" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 18, fontWeight: 600 }}>{green_report.carbon_reduction_kg}kg</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>减碳量</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <HeartPulse size={24} color="#eb2f96" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 18, fontWeight: 600 }}>{green_report.trees_equivalent}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>等效种树</div>
            </div>
          </div>
          <div
            style={{ textAlign: 'center', color: '#1890ff', cursor: 'pointer', fontSize: 13 }}
            onClick={() => navigate('/energy')}
          >
            查看完整报告 <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <Battery size={18} color="#faad14" />
            家电能耗明细 TOP5
          </div>
          {top5_consumption.map((item, i) => (
            <div key={i} style={styles.top5Item}>
              <div
                style={{
                  ...styles.deviceDot,
                  background: deviceTypeColors[item.type] || deviceTypeColors['其他']
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.kwh}kWh</span>
                    {item.trend === 'up' && <TrendingUp size={14} color="#ff4d4f" />}
                    {item.trend === 'down' && <TrendingDown size={14} color="#52c41a" />}
                    {item.trend === 'stable' && <Minus size={14} color="#8c8c8c" />}
                  </div>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${item.percentage}%`,
                      background: deviceTypeColors[item.type] || deviceTypeColors['其他']
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.grid21}>
        <div style={styles.panel}>
          <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="#faad14" />
              场景控制中心
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ ...styles.button, ...styles.buttonDefault, fontSize: 12, padding: '6px 14px' }}
                onClick={() => setShowNLInput(!showNLInput)}
              >
                <MessageSquare size={14} />
                自然语言指令
              </button>
              <button
                style={{ ...styles.button, ...styles.buttonDefault, fontSize: 12, padding: '6px 14px' }}
                onClick={() => setShowGeekMode(!showGeekMode)}
              >
                <Code size={14} />
                极客模式JSON
              </button>
            </div>
          </div>

          {showNLInput && (
            <div style={styles.nlInput}>
              <input
                style={styles.input}
                placeholder="说点什么，比如'我回家了'"
                value={nlCommand}
                onChange={(e) => setNlCommand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNlSubmit()}
              />
              <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={handleNlSubmit}>
                执行
              </button>
            </div>
          )}

          {showGeekMode && (
            <pre style={styles.codeBlock}>
              {JSON.stringify(geekModeExample, null, 2)}
            </pre>
          )}

          <div style={{ marginTop: 16 }}>
            {quick_scenes.map((scene) => (
              <div
                key={scene.id}
                style={{
                  ...styles.sceneCard,
                  ...(executingSceneId === scene.id ? styles.sceneCardActive : {})
                }}
                onClick={() => handleSceneExecute(scene.id, scene.name)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e6f7ff'; e.currentTarget.style.borderColor = '#91d5ff' }}
                onMouseLeave={(e) => {
                  if (executingSceneId !== scene.id) {
                    e.currentTarget.style.background = '#fafafa'
                    e.currentTarget.style.borderColor = '#e8e8e8'
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {executingSceneId === scene.id ? (
                        <Loader2 size={16} style={styles.spinner} />
                      ) : null}
                      {' '}{scene.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>{scene.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>{scene.action_count}个动作</span>
                    <ArrowRight size={16} color="#999" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {executionResult && (
            <div style={{
              ...styles.executionResult,
              border: '1px solid',
              borderColor: executionResult.status === 'success' ? '#b7eb8f'
                : executionResult.status === 'partial' ? '#ffe58f'
                : '#ffa39e'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                {executionResult.status === 'success' && <CheckCircle size={20} color="#52c41a" />}
                {executionResult.status === 'partial' && <AlertCircle size={20} color="#faad14" />}
                {executionResult.status === 'failed' && <XCircle size={20} color="#ff4d4f" />}
                <span style={{ fontWeight: 600 }}>
                  {executionResult.status === 'success' ? '执行成功'
                    : executionResult.status === 'partial' ? '部分失败'
                    : '执行失败'}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8c8c8c' }}>
                  耗时 {executionResult.duration_ms}ms
                </span>
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {executionResult.device_results.map((result, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                    {result.status === 'success'
                      ? <CheckCircle size={14} color="#52c41a" />
                      : <XCircle size={14} color="#ff4d4f" />
                    }
                    <span style={{ flex: 1 }}>{result.device_name}</span>
                    {result.error && <span style={{ color: '#ff4d4f', fontSize: 12 }}>{result.error}</span>}
                  </div>
                ))}
              </div>
              {executionResult.status !== 'success' && (
                <button
                  style={{ ...styles.button, ...styles.buttonDefault, marginTop: 12, width: '100%', justifyContent: 'center' }}
                  onClick={handleRetryFailed}
                >
                  <RefreshCw size={14} />
                  重试失败设备
                </button>
              )}
            </div>
          )}
        </div>

        <div style={styles.panel}>
          <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <Clock size={18} color="#722ed1" />
            最近执行记录
          </div>
          {recent_executions.map((exec, i) => (
            <div
              key={i}
              style={styles.recentItem}
              onClick={() => setSelectedExecution(exec)}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {exec.status === 'success' && <CheckCircle size={16} color="#52c41a" />}
              {exec.status === 'partial' && <AlertCircle size={16} color="#faad14" />}
              {exec.status === 'failed' && <XCircle size={16} color="#ff4d4f" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exec.scene_name}
                </div>
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>{exec.executed_at}</div>
              </div>
              <ChevronRight size={14} color="#999" />
            </div>
          ))}
        </div>
      </div>

      <div style={styles.fullPanel}>
        <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartPulse size={18} color="#eb2f96" />
            最近设备状态
          </div>
          <span
            style={{ fontSize: 13, color: '#1890ff', cursor: 'pointer' }}
            onClick={() => navigate('/devices')}
          >
            查看全部 →
          </span>
        </div>

        <div style={styles.tableHeader}>
          <span>设备名称</span>
          <span>状态</span>
          <span>健康分数</span>
          <span>固件状态</span>
          <span>服务状态</span>
          <span>商城配件</span>
        </div>

        {recent_devices.map((device) => (
          <div key={device.id} style={styles.tableRow}>
            <div>
              <div style={{ fontWeight: 500 }}>{device.name}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{device.brand}</div>
            </div>
            <span style={{
              ...styles.badge,
              background: device.status === 'online' ? '#f6ffed' : '#fff1f0',
              color: device.status === 'online' ? '#52c41a' : '#ff4d4f'
            }}>
              {device.status === 'online' ? <Wifi size={12} style={{ marginRight: 2 }} /> : <WifiOff size={12} style={{ marginRight: 2 }} />}
              {device.status === 'online' ? '在线' : '离线'}
            </span>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: device.health_score >= 80 ? '#52c41a' : device.health_score >= 60 ? '#faad14' : '#ff4d4f' }}>
                  {device.health_score}分
                </span>
              </div>
              <div style={styles.healthBar}>
                <div style={{
                  height: '100%',
                  background: device.health_score >= 80 ? '#52c41a' : device.health_score >= 60 ? '#faad14' : '#ff4d4f',
                  width: `${device.health_score}%`,
                  transition: 'width 0.5s'
                }} />
              </div>
            </div>
            <span style={{
              ...styles.badge,
              background: device.firmware_status === 'latest' ? '#f6ffed'
                : device.firmware_status === 'pending' ? '#fff7e6'
                : '#f0f5ff',
              color: device.firmware_status === 'latest' ? '#52c41a'
                : device.firmware_status === 'pending' ? '#faad14'
                : '#1890ff'
            }}>
              {device.firmware_status === 'latest' ? '最新'
                : device.firmware_status === 'pending' ? '待更新'
                : '灰度中'}
            </span>
            <span style={{
              ...styles.badge,
              background: device.service_status === 'normal' ? '#f6ffed'
                : device.service_status === 'pending' ? '#fff7e6'
                : '#fff1f0',
              color: device.service_status === 'normal' ? '#52c41a'
                : device.service_status === 'pending' ? '#faad14'
                : '#ff4d4f'
            }}>
              {device.service_status === 'normal' ? '正常'
                : device.service_status === 'pending' ? '待维修'
                : '延保过期'}
            </span>
            <div style={{ fontSize: 12 }}>
              <div style={{ color: '#666' }}>{device.accessories_count}件配件可用</div>
              <div style={{ color: '#52c41a' }}>以旧换新估价¥{device.tradein_value}</div>
            </div>
          </div>
        ))}

        <div style={{ ...styles.panelTitle, fontSize: 15, fontWeight: 600, marginTop: 32, marginBottom: 16 }}>
          <Shield size={18} color="#1890ff" />
          业务链路快捷入口
        </div>

        <div style={styles.quickEntryGrid}>
          {businessQuickEntries.map((entry, i) => (
            <div
              key={i}
              style={styles.quickEntryCard}
              onClick={() => navigate(entry.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e6f7ff'
                e.currentTarget.style.borderColor = '#91d5ff'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fafafa'
                e.currentTarget.style.borderColor = '#e8e8e8'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${entry.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px'
              }}>
                <entry.icon size={20} color={entry.color} />
              </div>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>{entry.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: entry.color }}>{entry.value}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedExecution && (
        <div style={styles.modalOverlay} onClick={() => setSelectedExecution(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0' }}>执行详情</h3>
            <div style={{ marginBottom: 12 }}>
              <strong>场景:</strong> {selectedExecution.scene_name}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>时间:</strong> {selectedExecution.executed_at}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>状态:</strong>
              {selectedExecution.status === 'success' && <span style={{ color: '#52c41a', marginLeft: 8 }}>成功</span>}
              {selectedExecution.status === 'partial' && <span style={{ color: '#faad14', marginLeft: 8 }}>部分失败</span>}
              {selectedExecution.status === 'failed' && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>失败</span>}
            </div>
            <button
              style={{ ...styles.button, ...styles.buttonDefault, width: '100%', justifyContent: 'center', marginTop: 16 }}
              onClick={() => setSelectedExecution(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
