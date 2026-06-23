import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  User,
  Phone,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Battery,
  CreditCard,
  MoreHorizontal,
} from 'lucide-react'
import { StatusBadge } from '@shared/components/StatusBadge'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { mockRiders } from '@mock/data'
import { cn, formatDate } from '@shared/utils'
import type { Rider } from '@shared/types'

const verifyFilters = [
  { value: 'all', label: '全部核验状态' },
  { value: 'verified', label: '已核验' },
  { value: 'pending', label: '待核验' },
  { value: 'rejected', label: '已驳回' },
]

const statusFilters = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'suspended', label: '已停用' },
  { value: 'banned', label: '已封禁' },
]

export default function RidersPage() {
  const [searchText, setSearchText] = useState('')
  const [verifyFilter, setVerifyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showVerifyDropdown, setShowVerifyDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const pageSize = 6

  const riders = mockRiders

  const filteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      const matchesSearch =
        rider.real_name.toLowerCase().includes(searchText.toLowerCase()) ||
        rider.phone.includes(searchText) ||
        rider.rider_id.toLowerCase().includes(searchText.toLowerCase())
      const matchesVerify =
        verifyFilter === 'all' || rider.verify_status === verifyFilter
      const matchesStatus =
        statusFilter === 'all' || rider.status === statusFilter
      return matchesSearch && matchesVerify && matchesStatus
    })
  }, [riders, searchText, verifyFilter, statusFilter])

  const paginatedRiders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRiders.slice(start, start + pageSize)
  }, [filteredRiders, currentPage])

  const totalPages = Math.ceil(filteredRiders.length / pageSize)

  const stats = useMemo(() => {
    const total = riders.length
    const verified = riders.filter((r) => r.verify_status === 'verified').length
    const active = riders.filter((r) => r.status === 'active').length
    const pending = riders.filter((r) => r.verify_status === 'pending').length
    return { total, verified, active, pending }
  }, [riders])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-rajdhani text-white">骑士管理</h1>
          <p className="text-cyber-muted text-sm mt-1">
            共 {riders.length} 名骑士，{filteredRiders.length} 名符合筛选条件
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/20 transition-colors font-medium text-sm">
            导出数据
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyber-accent" />
            <span className="text-xs text-cyber-muted">注册骑士</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.total}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-cyber-success" />
            <span className="text-xs text-cyber-muted">已核验</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.verified}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-cyber-success" />
            <span className="text-xs text-cyber-muted">活跃骑士</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.active}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyber-warning" />
            <span className="text-xs text-cyber-muted">待核验</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.pending}
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
            <input
              type="text"
              placeholder="搜索骑士姓名、手机号、编号..."
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
              show: showVerifyDropdown,
              setShow: setShowVerifyDropdown,
              value: verifyFilter,
              setValue: setVerifyFilter,
              filters: verifyFilters,
            },
            {
              show: showStatusDropdown,
              setShow: setShowStatusDropdown,
              value: statusFilter,
              setValue: setStatusFilter,
              filters: statusFilters,
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
                <span>
                  {dropdown.filters.find((f) => f.value === dropdown.value)?.label}
                </span>
                {dropdown.show ? (
                  <ChevronUp className="w-4 h-4 text-cyber-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-cyber-muted" />
                )}
              </button>
              {dropdown.show && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl z-10 overflow-hidden">
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
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 骑士列表 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="px-5 py-3 text-left text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  骑士信息
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  手机号
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  实名核验
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  驾驶证
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  当前电量
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  累计换电
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
              {paginatedRiders.map((rider, index) => (
                <motion.tr
                  key={rider.rider_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-cyber-light/20 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-accent to-cyan-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{rider.real_name}</p>
                        <p className="text-xs text-cyber-muted font-mono">
                          {rider.rider_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-white font-mono text-sm">
                      {rider.phone}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {rider.verify_status === 'verified' ? (
                        <div className="flex items-center gap-1.5 text-cyber-success">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-sm">已核验</span>
                        </div>
                      ) : rider.verify_status === 'pending' ? (
                        <div className="flex items-center gap-1.5 text-cyber-warning">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">待核验</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-cyber-danger">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="text-sm">已驳回</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {rider.driver_license_no ? (
                      <div>
                        <p className="text-sm text-white font-mono">
                          {rider.driver_license_type}
                        </p>
                        <p className="text-xs text-cyber-muted">
                          {rider.driver_license_no.slice(-4)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-cyber-muted text-sm">未上传</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {rider.current_soc !== undefined ? (
                        <BatteryGauge soc={rider.current_soc} size="sm" />
                      ) : (
                        <span className="text-cyber-muted text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-mono text-white">{rider.total_swaps}</span>
                    <span className="text-xs text-cyber-muted ml-1">次</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <StatusBadge
                        status={
                          rider.status === 'active'
                            ? '正常'
                            : rider.status === 'suspended'
                            ? '停用'
                            : '封禁'
                        }
                        color={
                          rider.status === 'active'
                            ? 'success'
                            : rider.status === 'suspended'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        pulse={rider.status === 'active'}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setSelectedRider(rider)}
                        className="p-2 text-cyber-muted hover:text-cyber-accent hover:bg-cyber-light/30 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-cyber-border flex items-center justify-between">
            <span className="text-sm text-cyber-muted">
              共 {filteredRiders.length} 条记录，第 {currentPage} / {totalPages} 页
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
      {selectedRider && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedRider(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-cyber-dark border-l border-cyber-border z-50 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-accent to-cyan-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-rajdhani text-white">
                    {selectedRider.real_name}
                  </h2>
                  <p className="text-sm text-cyber-muted font-mono">
                    {selectedRider.rider_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRider(null)}
                className="p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-light/30 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 基本信息 */}
              <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                  <User className="w-4 h-4" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-cyber-muted">手机号</span>
                    <p className="text-white mt-0.5 font-mono">
                      {selectedRider.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">注册时间</span>
                    <p className="text-white mt-0.5">
                      {formatDate(selectedRider.register_date, 'YYYY-MM-DD')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">身份证</span>
                    <p className="text-white mt-0.5 font-mono">
                      {selectedRider.id_card}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">核验状态</span>
                    <p
                      className={cn(
                        'mt-0.5',
                        selectedRider.verify_status === 'verified'
                          ? 'text-cyber-success'
                          : selectedRider.verify_status === 'pending'
                          ? 'text-cyber-warning'
                          : 'text-cyber-danger'
                      )}
                    >
                      {selectedRider.verify_status === 'verified'
                        ? '已核验'
                        : selectedRider.verify_status === 'pending'
                        ? '待核验'
                        : '已驳回'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 驾驶证信息 */}
              <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  驾驶证信息
                </h3>
                {selectedRider.driver_license_no ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-cyber-muted">驾驶证号</span>
                      <p className="text-white mt-0.5 font-mono">
                        {selectedRider.driver_license_no}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-cyber-muted">准驾车型</span>
                      <p className="text-white mt-0.5">
                        {selectedRider.driver_license_type}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-cyber-muted">有效期至</span>
                      <p className="text-white mt-0.5">
                        {formatDate(selectedRider.driver_license_expiry, 'YYYY-MM-DD')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-cyber-muted">暂未上传驾驶证</p>
                )}
              </div>

              {/* 账户信息 */}
              <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  账户信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-cyber-muted">套餐余额</span>
                    <p className="text-cyber-success mt-0.5 font-rajdhani font-bold text-lg">
                      {selectedRider.package_balance}
                      <span className="text-xs font-normal ml-1">次</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">累计换电</span>
                    <p className="text-white mt-0.5 font-rajdhani font-bold text-lg">
                      {selectedRider.total_swaps}
                      <span className="text-xs font-normal ml-1">次</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 当前状态 */}
              <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  当前状态
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-cyber-muted">账户状态</span>
                    <p
                      className={cn(
                        'mt-0.5',
                        selectedRider.status === 'active'
                          ? 'text-cyber-success'
                          : selectedRider.status === 'suspended'
                          ? 'text-cyber-warning'
                          : 'text-cyber-danger'
                      )}
                    >
                      {selectedRider.status === 'active'
                        ? '正常'
                        : selectedRider.status === 'suspended'
                        ? '已停用'
                        : '已封禁'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">当前电池</span>
                    <p className="text-white mt-0.5 font-mono">
                      {selectedRider.current_battery_id || '-'}
                    </p>
                  </div>
                  {selectedRider.current_soc !== undefined && (
                    <div className="col-span-2">
                      <span className="text-xs text-cyber-muted">当前电量</span>
                      <div className="mt-1">
                        <BatteryGauge soc={selectedRider.current_soc} size="md" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-cyber-border flex gap-3">
              {selectedRider.status === 'active' ? (
                <button className="flex-1 py-2.5 bg-cyber-warning/10 border border-cyber-warning/50 text-cyber-warning rounded-lg hover:bg-cyber-warning/20 transition-colors font-medium text-sm">
                  停用账号
                </button>
              ) : (
                <button className="flex-1 py-2.5 bg-cyber-success/10 border border-cyber-success/50 text-cyber-success rounded-lg hover:bg-cyber-success/20 transition-colors font-medium text-sm">
                  恢复账号
                </button>
              )}
              <button className="flex-1 py-2.5 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm">
                查看详情
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
