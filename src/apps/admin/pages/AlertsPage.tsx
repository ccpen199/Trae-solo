import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Search,
  Filter,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  User,
  Wifi,
  Thermometer,
  Settings,
  Battery,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { StatusBadge } from '@shared/components/StatusBadge'
import { useAlertStore } from '@shared/stores/alertStore'
import { cn, formatDate } from '@shared/utils'
import { ALERT_LEVELS, ALERT_TYPES } from '@shared/constants'
import type { Alert } from '@shared/types'

const levelFilters = [
  { value: 'all', label: '全部级别' },
  { value: 'critical', label: '严重' },
  { value: 'warning', label: '警告' },
  { value: 'info', label: '提示' },
]

const statusFilters = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
]

const typeFilters = [
  { value: 'all', label: '全部类型' },
  { value: 'comm', label: '通信故障' },
  { value: 'temp', label: '温控异常' },
  { value: 'mechanical', label: '机械故障' },
  { value: 'battery', label: '电池异常' },
]

export default function AlertsPage() {
  const { alerts, markAsRead, resolveAlert } = useAlertStore()
  const [searchText, setSearchText] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.title.toLowerCase().includes(searchText.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (alert.cabinet_name && alert.cabinet_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (alert.battery_id && alert.battery_id.toLowerCase().includes(searchText.toLowerCase()))
      const matchesLevel = levelFilter === 'all' || alert.level === levelFilter
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter
      const matchesType = typeFilter === 'all' || alert.type === typeFilter
      return matchesSearch && matchesLevel && matchesStatus && matchesType
    })
  }, [alerts, searchText, levelFilter, statusFilter, typeFilter])

  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAlerts.slice(start, start + pageSize)
  }, [filteredAlerts, currentPage])

  const totalPages = Math.ceil(filteredAlerts.length / pageSize)

  const stats = useMemo(() => {
    const critical = alerts.filter((a) => a.level === 'critical' && a.status !== 'resolved').length
    const warning = alerts.filter((a) => a.level === 'warning' && a.status !== 'resolved').length
    const info = alerts.filter((a) => a.level === 'info' && a.status !== 'resolved').length
    const pending = alerts.filter((a) => a.status === 'pending').length
    return { critical, warning, info, pending, total: alerts.length }
  }, [alerts])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'comm':
        return Wifi
      case 'temp':
        return Thermometer
      case 'mechanical':
        return Settings
      case 'battery':
        return Battery
      default:
        return AlertCircle
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return AlertTriangle
      case 'warning':
        return AlertCircle
      default:
        return Info
    }
  }

  const handleViewDetail = (alert: Alert) => {
    setSelectedAlert(alert)
    if (alert.status === 'pending') {
      markAsRead(alert.alert_id)
    }
  }

  const handleResolve = (alertId: string) => {
    resolveAlert(alertId, '管理员')
    setSelectedAlert(null)
  }

  const handleMarkProcessing = (alertId: string) => {
    markAsRead(alertId)
    if (selectedAlert?.alert_id === alertId) {
      setSelectedAlert({ ...selectedAlert, status: 'processing' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-rajdhani text-white">告警中心</h1>
          <p className="text-cyber-muted text-sm mt-1">
            共 {alerts.length} 条告警，{stats.pending} 条待处理
          </p>
        </div>
        <button className="px-4 py-2 bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/20 transition-colors font-medium text-sm">
          导出告警记录
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative bg-gradient-to-br from-cyber-danger/20 to-transparent border border-cyber-danger/40 rounded-lg p-4 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyber-danger/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyber-danger/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-cyber-danger" />
            </div>
            <div>
              <div className="text-2xl font-bold font-rajdhani text-cyber-danger">
                {stats.critical}
              </div>
              <div className="text-sm text-cyber-muted">严重告警</div>
            </div>
          </div>
          {stats.critical > 0 && (
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-2 right-2 w-2.5 h-2.5 bg-cyber-danger rounded-full"
            />
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative bg-gradient-to-br from-cyber-warning/20 to-transparent border border-cyber-warning/40 rounded-lg p-4 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyber-warning/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyber-warning/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-cyber-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold font-rajdhani text-cyber-warning">
                {stats.warning}
              </div>
              <div className="text-sm text-cyber-muted">警告告警</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative bg-gradient-to-br from-cyber-accent/20 to-transparent border border-cyber-accent/40 rounded-lg p-4 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyber-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
              <Info className="w-6 h-6 text-cyber-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold font-rajdhani text-cyber-accent">
                {stats.info}
              </div>
              <div className="text-sm text-cyber-muted">提示告警</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative bg-gradient-to-br from-cyber-success/20 to-transparent border border-cyber-success/40 rounded-lg p-4 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyber-success/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyber-success/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-cyber-success" />
            </div>
            <div>
              <div className="text-2xl font-bold font-rajdhani text-cyber-success">
                {alerts.filter((a) => a.status === 'resolved').length}
              </div>
              <div className="text-sm text-cyber-muted">已解决</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
            <input
              type="text"
              placeholder="搜索告警标题、描述、柜体..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-10 pl-10 pr-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/30 transition-all"
            />
          </div>

          {[
            {
              show: showLevelDropdown,
              setShow: setShowLevelDropdown,
              value: levelFilter,
              setValue: setLevelFilter,
              filters: levelFilters,
              label: '级别',
            },
            {
              show: showStatusDropdown,
              setShow: setShowStatusDropdown,
              value: statusFilter,
              setValue: setStatusFilter,
              filters: statusFilters,
              label: '状态',
            },
            {
              show: showTypeDropdown,
              setShow: setShowTypeDropdown,
              value: typeFilter,
              setValue: setTypeFilter,
              filters: typeFilters,
              label: '类型',
            },
          ].map((dropdown, idx) => (
            <div key={idx} className="relative">
              <button
                onClick={() => {
                  dropdown.setShow(!dropdown.show)
                }}
                className="h-10 px-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white flex items-center gap-2 hover:border-cyber-accent/50 transition-colors"
              >
                <Filter className="w-4 h-4 text-cyber-muted" />
                <span>{dropdown.filters.find((f) => f.value === dropdown.value)?.label}</span>
                {dropdown.show ? (
                  <ChevronUp className="w-4 h-4 text-cyber-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-cyber-muted" />
                )}
              </button>
              <AnimatePresence>
                {dropdown.show && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-1 w-32 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl z-10 overflow-hidden"
                  >
                    {dropdown.filters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => {
                          dropdown.setValue(filter.value)
                          setCurrentPage(1)
                          dropdown.setShow(false)
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-cyber-light/30 transition-colors',
                          dropdown.value === filter.value
                            ? 'text-cyber-accent bg-cyber-accent/10'
                            : 'text-gray-300'
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* 告警列表 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
        <div className="divide-y divide-cyber-border/50">
          {paginatedAlerts.map((alert, index) => {
            const LevelIcon = getLevelIcon(alert.level)
            const TypeIcon = getAlertIcon(alert.type)

            return (
              <motion.div
                key={alert.alert_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ backgroundColor: 'rgba(15, 40, 71, 0.3)' }}
                className="p-4 cursor-pointer transition-colors"
                onClick={() => handleViewDetail(alert)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      alert.level === 'critical'
                        ? 'bg-cyber-danger/20'
                        : alert.level === 'warning'
                        ? 'bg-cyber-warning/20'
                        : 'bg-cyber-accent/20'
                    )}
                  >
                    <LevelIcon
                      className={cn(
                        'w-5 h-5',
                        alert.level === 'critical'
                          ? 'text-cyber-danger'
                          : alert.level === 'warning'
                          ? 'text-cyber-warning'
                          : 'text-cyber-accent'
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{alert.title}</h3>
                      {alert.status === 'pending' && (
                        <motion.span
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-cyber-danger rounded-full"
                        />
                      )}
                    </div>
                    <p className="text-sm text-cyber-muted line-clamp-2 mb-2">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-cyber-muted">
                      <span className="flex items-center gap-1">
                        <TypeIcon className="w-3.5 h-3.5" />
                        {ALERT_TYPES[alert.type]?.label || alert.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(alert.created_at, 'MM-DD HH:mm')}
                      </span>
                      {alert.cabinet_name && (
                        <span className="flex items-center gap-1">
                          <Bell className="w-3.5 h-3.5" />
                          {alert.cabinet_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <StatusBadge
                      status={ALERT_LEVELS[alert.level as keyof typeof ALERT_LEVELS].label}
                      color={
                        alert.level === 'critical'
                          ? 'danger'
                          : alert.level === 'warning'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                      pulse={alert.status === 'pending' && alert.level === 'critical'}
                    />
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        alert.status === 'pending'
                          ? 'bg-cyber-danger/20 text-cyber-danger'
                          : alert.status === 'processing'
                          ? 'bg-cyber-warning/20 text-cyber-warning'
                          : 'bg-cyber-success/20 text-cyber-success'
                      )}
                    >
                      {alert.status === 'pending'
                        ? '待处理'
                        : alert.status === 'processing'
                        ? '处理中'
                        : '已解决'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-cyber-border flex items-center justify-between">
            <span className="text-sm text-cyber-muted">
              共 {filteredAlerts.length} 条记录，第 {currentPage} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-cyber-border rounded hover:border-cyber-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-8 h-8 text-sm rounded transition-colors',
                    currentPage === page
                      ? 'bg-cyber-accent text-cyber-darker font-medium'
                      : 'text-gray-300 hover:bg-cyber-light/30'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-cyber-border rounded hover:border-cyber-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情抽屉 */}
      <AnimatePresence>
        {selectedAlert && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedAlert(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-cyber-dark border-l border-cyber-border z-50 overflow-hidden flex flex-col"
            >
              {/* 头部 */}
              <div
                className={cn(
                  'px-6 py-4 border-b border-cyber-border flex items-center justify-between',
                  selectedAlert.level === 'critical'
                    ? 'bg-cyber-danger/10'
                    : selectedAlert.level === 'warning'
                    ? 'bg-cyber-warning/10'
                    : 'bg-cyber-accent/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      selectedAlert.level === 'critical'
                        ? 'bg-cyber-danger/20'
                        : selectedAlert.level === 'warning'
                        ? 'bg-cyber-warning/20'
                        : 'bg-cyber-accent/20'
                    )}
                  >
                    {(() => {
                      const Icon = getLevelIcon(selectedAlert.level)
                      return (
                        <Icon
                          className={cn(
                            'w-5 h-5',
                            selectedAlert.level === 'critical'
                              ? 'text-cyber-danger'
                              : selectedAlert.level === 'warning'
                              ? 'text-cyber-warning'
                              : 'text-cyber-accent'
                          )}
                        />
                      )
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-rajdhani text-white">
                      {selectedAlert.title}
                    </h2>
                    <p className="text-xs text-cyber-muted">
                      {ALERT_LEVELS[selectedAlert.level as keyof typeof ALERT_LEVELS].label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-light/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 告警详情 */}
                <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-xs text-cyber-muted">告警描述</span>
                    <p className="text-sm text-white mt-1">{selectedAlert.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-cyber-muted">告警类型</span>
                      <p className="text-white mt-0.5">
                        {ALERT_TYPES[selectedAlert.type as keyof typeof ALERT_TYPES]?.label}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-cyber-muted">告警状态</span>
                      <p
                        className={cn(
                          'mt-0.5',
                          selectedAlert.status === 'pending'
                            ? 'text-cyber-danger'
                            : selectedAlert.status === 'processing'
                            ? 'text-cyber-warning'
                            : 'text-cyber-success'
                        )}
                      >
                        {selectedAlert.status === 'pending'
                          ? '待处理'
                          : selectedAlert.status === 'processing'
                          ? '处理中'
                          : '已解决'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-cyber-muted">创建时间</span>
                      <p className="text-white mt-0.5">
                        {formatDate(selectedAlert.created_at, 'YYYY-MM-DD HH:mm:ss')}
                      </p>
                    </div>
                    {selectedAlert.resolved_at && (
                      <div>
                        <span className="text-xs text-cyber-muted">解决时间</span>
                        <p className="text-white mt-0.5">
                          {formatDate(selectedAlert.resolved_at, 'YYYY-MM-DD HH:mm:ss')}
                        </p>
                      </div>
                    )}
                    {selectedAlert.handler && (
                      <div>
                        <span className="text-xs text-cyber-muted">处理人</span>
                        <p className="text-white mt-0.5">{selectedAlert.handler}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 关联对象 */}
                <div className="bg-cyber-darker/50 rounded-lg p-4">
                  <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3">
                    关联对象
                  </h3>
                  {selectedAlert.cabinet_name ? (
                    <div className="flex items-center gap-3 p-3 bg-cyber-dark/50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-cyber-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{selectedAlert.cabinet_name}</p>
                        <p className="text-xs text-cyber-muted">{selectedAlert.cabinet_id}</p>
                      </div>
                    </div>
                  ) : selectedAlert.battery_id ? (
                    <div className="flex items-center gap-3 p-3 bg-cyber-dark/50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
                        <Battery className="w-5 h-5 text-cyber-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{selectedAlert.battery_id}</p>
                        <p className="text-xs text-cyber-muted">电池</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-cyber-muted">无关联对象</p>
                  )}
                </div>

                {/* 处理记录 */}
                <div className="bg-cyber-darker/50 rounded-lg p-4">
                  <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3">
                    处理记录
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyber-accent mt-1.5" />
                      <div>
                        <p className="text-sm text-white">告警创建</p>
                        <p className="text-xs text-cyber-muted">
                          {formatDate(selectedAlert.created_at, 'YYYY-MM-DD HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    {selectedAlert.status !== 'pending' && (
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyber-warning mt-1.5" />
                        <div>
                          <p className="text-sm text-white">开始处理</p>
                          <p className="text-xs text-cyber-muted">
                            {selectedAlert.handler || '系统自动'}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedAlert.status === 'resolved' && (
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyber-success mt-1.5" />
                        <div>
                          <p className="text-sm text-white">告警已解决</p>
                          <p className="text-xs text-cyber-muted">
                            {selectedAlert.resolved_at &&
                              formatDate(selectedAlert.resolved_at, 'YYYY-MM-DD HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 底部操作 */}
              <div className="px-6 py-4 border-t border-cyber-border flex gap-3">
                {selectedAlert.status === 'pending' && (
                  <button
                    onClick={() => handleMarkProcessing(selectedAlert.alert_id)}
                    className="flex-1 py-2.5 bg-cyber-warning/10 border border-cyber-warning/50 text-cyber-warning rounded-lg hover:bg-cyber-warning/20 transition-colors font-medium text-sm"
                  >
                    标记处理中
                  </button>
                )}
                {selectedAlert.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(selectedAlert.alert_id)}
                    className="flex-1 py-2.5 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm"
                  >
                    标记已解决
                  </button>
                )}
                {selectedAlert.status === 'resolved' && (
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="flex-1 py-2.5 bg-cyber-light/30 text-white rounded-lg hover:bg-cyber-light/50 transition-colors font-medium text-sm"
                  >
                    关闭
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
