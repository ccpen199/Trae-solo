import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Search,
  Filter,
  MapPin,
  Thermometer,
  Wifi,
  WifiOff,
  X,
  ChevronDown,
  ChevronUp,
  Battery,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { StatusBadge } from '@shared/components/StatusBadge'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { useCabinetStore } from '@shared/stores/cabinetStore'
import { cn, formatDate } from '@shared/utils'
import { CABINET_STATUS } from '@shared/constants'
import type { Cabinet, CabinetSlot } from '@shared/types'

const statusFilters = [
  { value: 'all', label: '全部状态' },
  { value: 'running', label: '运行中' },
  { value: 'warning', label: '告警' },
  { value: 'fault', label: '故障' },
]

export default function CabinetsPage() {
  const { cabinets, selectedCabinet, setSelectedCabinet } = useCabinetStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const filteredCabinets = useMemo(() => {
    return cabinets.filter((cabinet) => {
      const matchesSearch =
        cabinet.name.toLowerCase().includes(searchText.toLowerCase()) ||
        cabinet.location.toLowerCase().includes(searchText.toLowerCase()) ||
        cabinet.cabinet_id.toLowerCase().includes(searchText.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' || cabinet.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [cabinets, searchText, statusFilter])

  const paginatedCabinets = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCabinets.slice(start, start + pageSize)
  }, [filteredCabinets, currentPage])

  const totalPages = Math.ceil(filteredCabinets.length / pageSize)

  const handleViewDetail = (cabinet: Cabinet) => {
    setSelectedCabinet(cabinet)
  }

  const handleCloseDetail = () => {
    setSelectedCabinet(null)
  }

  const getSlotStatusColor = (status: CabinetSlot['status']) => {
    switch (status) {
      case 'occupied':
        return 'bg-cyber-success border-cyber-success'
      case 'charging':
        return 'bg-cyber-accent border-cyber-accent'
      case 'fault':
        return 'bg-cyber-danger border-cyber-danger'
      case 'locked':
        return 'bg-cyber-warning border-cyber-warning'
      default:
        return 'bg-cyber-border/50 border-cyber-border'
    }
  }

  const getSlotStatusLabel = (status: CabinetSlot['status']) => {
    switch (status) {
      case 'occupied':
        return '已满'
      case 'charging':
        return '充电中'
      case 'fault':
        return '故障'
      case 'locked':
        return '锁定'
      default:
        return '空闲'
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
          <h1 className="text-2xl font-bold font-rajdhani text-white">
            换电柜管理
          </h1>
          <p className="text-cyber-muted text-sm mt-1">
            共 {cabinets.length} 台换电柜，{filteredCabinets.length} 台符合筛选条件
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/20 transition-colors font-medium text-sm">
            导出数据
          </button>
          <button className="px-4 py-2 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm">
            新增柜体
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
            <input
              type="text"
              placeholder="搜索柜体名称、编号、地址..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-10 pl-10 pr-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/30 transition-all"
            />
          </div>

          {/* 状态筛选 */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="h-10 px-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white flex items-center gap-2 hover:border-cyber-accent/50 transition-colors"
            >
              <Filter className="w-4 h-4 text-cyber-muted" />
              <span>
                {statusFilters.find((f) => f.value === statusFilter)?.label}
              </span>
              {showStatusDropdown ? (
                <ChevronUp className="w-4 h-4 text-cyber-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-cyber-muted" />
              )}
            </button>

            <AnimatePresence>
              {showStatusDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-40 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl z-10 overflow-hidden"
                >
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setStatusFilter(filter.value)
                        setCurrentPage(1)
                        setShowStatusDropdown(false)
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-cyber-light/30 transition-colors',
                        statusFilter === filter.value
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
        </div>
      </div>

      {/* 柜体表格 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="px-5 py-3 text-left text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  柜体信息
                </th>
                <th className="px-5 py-3 text-left text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  位置
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  仓位状态
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  温度
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  通信
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  状态
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {paginatedCabinets.map((cabinet, index) => (
                <motion.tr
                  key={cabinet.cabinet_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-cyber-light/20 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          cabinet.status === 'running'
                            ? 'bg-cyber-success/20 text-cyber-success'
                            : cabinet.status === 'warning'
                            ? 'bg-cyber-warning/20 text-cyber-warning'
                            : 'bg-cyber-danger/20 text-cyber-danger'
                        )}
                      >
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {cabinet.name}
                        </p>
                        <p className="text-xs text-cyber-muted font-mono">
                          {cabinet.cabinet_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-cyber-muted mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300 line-clamp-2">
                        {cabinet.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-white">
                          {cabinet.available_slots}
                        </span>
                        <span className="text-xs text-cyber-muted">
                          / {cabinet.total_slots} 可用
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-cyber-success">
                          {cabinet.full_batteries} 满电
                        </span>
                        <span className="text-cyber-accent">
                          {cabinet.charging_batteries} 充电中
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Thermometer
                        className={cn(
                          'w-4 h-4',
                          cabinet.current_temp > 30
                            ? 'text-cyber-warning'
                            : 'text-cyber-muted'
                        )}
                      />
                      <span
                        className={cn(
                          'font-mono text-sm',
                          cabinet.current_temp > 30
                            ? 'text-cyber-warning'
                            : 'text-white'
                        )}
                      >
                        {cabinet.current_temp}°C
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {cabinet.comm_status === 'online' ? (
                        <>
                          <Wifi className="w-4 h-4 text-cyber-success" />
                          <span className="text-sm text-cyber-success">
                            在线
                          </span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4 text-cyber-danger" />
                          <span className="text-sm text-cyber-danger">离线</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <StatusBadge
                        status={CABINET_STATUS[cabinet.status].label}
                        color={
                          cabinet.status === 'running'
                            ? 'success'
                            : cabinet.status === 'warning'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        pulse={cabinet.status === 'running'}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetail(cabinet)}
                        className="px-3 py-1.5 text-sm text-cyber-accent hover:bg-cyber-accent/10 rounded transition-colors"
                      >
                        详情
                      </button>
                      <button className="px-3 py-1.5 text-sm text-cyber-muted hover:text-white hover:bg-cyber-light/30 rounded transition-colors">
                        编辑
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-cyber-border flex items-center justify-between">
          <span className="text-sm text-cyber-muted">
            共 {filteredCabinets.length} 条记录，第 {currentPage} / {totalPages} 页
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
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
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
        {selectedCabinet && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCloseDetail}
            />
            {/* 抽屉 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-cyber-dark border-l border-cyber-border z-50 overflow-hidden flex flex-col"
            >
              {/* 抽屉头部 */}
              <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-rajdhani text-white">
                  柜体详情
                </h2>
                <p className="text-sm text-cyber-muted mt-0.5">
                  {selectedCabinet.cabinet_id}
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-light/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 抽屉内容 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3 flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  基本信息
                </h3>
                <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-cyber-muted">柜体名称</span>
                    <span className="text-sm text-white font-medium">
                      {selectedCabinet.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-cyber-muted">柜体编号</span>
                    <span className="text-sm text-white font-mono">
                      {selectedCabinet.cabinet_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-cyber-muted">安装位置</span>
                    <span className="text-sm text-white text-right max-w-[60%]">
                      {selectedCabinet.location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-cyber-muted">运行状态</span>
                    <StatusBadge
                      status={CABINET_STATUS[selectedCabinet.status].label}
                      color={
                        selectedCabinet.status === 'running'
                          ? 'success'
                          : selectedCabinet.status === 'warning'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                      pulse={selectedCabinet.status === 'running'}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-cyber-muted">最后心跳</span>
                    <span className="text-sm text-white">
                      {formatDate(selectedCabinet.last_heartbeat, 'MM-DD HH:mm:ss')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 实时数据 */}
              <div>
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  实时数据
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cyber-darker/50 rounded-lg p-4">
                    <div className="text-xs text-cyber-muted mb-1">当前温度</div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-cyber-warning" />
                      <span className="text-xl font-bold font-rajdhani text-white">
                        {selectedCabinet.current_temp}°C
                      </span>
                    </div>
                    <div
                      className={cn(
                        'text-xs mt-1',
                        selectedCabinet.temp_control_status === 'normal'
                          ? 'text-cyber-success'
                          : 'text-cyber-danger'
                      )}
                    >
                      {selectedCabinet.temp_control_status === 'normal'
                        ? '温控正常'
                        : '温控异常'}
                    </div>
                  </div>
                  <div className="bg-cyber-darker/50 rounded-lg p-4">
                    <div className="text-xs text-cyber-muted mb-1">通信状态</div>
                    <div className="flex items-center gap-2">
                      {selectedCabinet.comm_status === 'online' ? (
                        <Wifi className="w-5 h-5 text-cyber-success" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-cyber-danger" />
                      )}
                      <span className="text-xl font-bold font-rajdhani text-white">
                        {selectedCabinet.comm_status === 'online'
                          ? '在线'
                          : '离线'}
                      </span>
                    </div>
                    <div className="text-xs text-cyber-muted mt-1">
                      {selectedCabinet.comm_status === 'online'
                        ? '通信正常'
                        : '连接中断'}
                    </div>
                  </div>
                  <div className="bg-cyber-darker/50 rounded-lg p-4">
                    <div className="text-xs text-cyber-muted mb-1">总仓位数</div>
                    <span className="text-xl font-bold font-rajdhani text-white">
                      {selectedCabinet.total_slots}
                    </span>
                    <div className="text-xs text-cyber-muted mt-1">
                      可用 {selectedCabinet.available_slots} 个
                    </div>
                  </div>
                  <div className="bg-cyber-darker/50 rounded-lg p-4">
                    <div className="text-xs text-cyber-muted mb-1">满电电池</div>
                    <span className="text-xl font-bold font-rajdhani text-cyber-success">
                      {selectedCabinet.full_batteries}
                    </span>
                    <div className="text-xs text-cyber-accent mt-1">
                      充电中 {selectedCabinet.charging_batteries} 个
                    </div>
                  </div>
                </div>
              </div>

              {/* 仓位状态可视化 */}
              <div>
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3 flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  仓位状态
                </h3>
                <div className="bg-cyber-darker/50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-3">
                    {selectedCabinet.slots.map((slot) => (
                      <motion.div
                        key={slot.slot_number}
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                          'relative rounded-lg border-2 p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all',
                          getSlotStatusColor(slot.status),
                          'bg-opacity-10'
                        )}
                        style={{
                          backgroundColor:
                            slot.status === 'empty'
                              ? 'rgba(26, 54, 86, 0.3)'
                              : undefined,
                        }}
                      >
                        <span className="text-xs text-cyber-muted font-mono">
                          {slot.slot_number}号
                        </span>
                        {slot.soc !== undefined && (
                          <BatteryGauge soc={slot.soc} size="sm" showLabel={false} />
                        )}
                        <span className="text-[10px] text-cyber-muted">
                          {getSlotStatusLabel(slot.status)}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* 图例 */}
                  <div className="mt-4 pt-3 border-t border-cyber-border/50 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-cyber-success" />
                      <span className="text-cyber-muted">满电</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-cyber-accent" />
                      <span className="text-cyber-muted">充电中</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-cyber-border/50" />
                      <span className="text-cyber-muted">空闲</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-cyber-danger" />
                      <span className="text-cyber-muted">故障</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-cyber-warning" />
                      <span className="text-cyber-muted">锁定</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 系统状态 */}
              <div>
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  系统状态
                </h3>
                <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">温控系统</span>
                    {selectedCabinet.temp_control_status === 'normal' ? (
                      <div className="flex items-center gap-1.5 text-cyber-success">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">正常</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-cyber-danger">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">异常</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">机械系统</span>
                    {selectedCabinet.mechanical_status === 'normal' ? (
                      <div className="flex items-center gap-1.5 text-cyber-success">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">正常</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-cyber-danger">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">卡顿</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">通信模块</span>
                    {selectedCabinet.comm_status === 'online' ? (
                      <div className="flex items-center gap-1.5 text-cyber-success">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">正常</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-cyber-danger">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">离线</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 抽屉底部 */}
            <div className="px-6 py-4 border-t border-cyber-border flex gap-3">
              <button className="flex-1 py-2.5 bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/20 transition-colors font-medium text-sm">
                远程重启
              </button>
              <button className="flex-1 py-2.5 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm">
                编辑信息
              </button>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
