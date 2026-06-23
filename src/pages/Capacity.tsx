import { useState } from 'react'
import {
  Truck,
  Ship,
  MapPin,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Search,
  RotateCcw,
  Home,
  FileText,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { Progress } from '../components/ui/Progress'
import { mockCapacity } from '../data/mock'
import { formatWeight, statusColor, cn } from '../utils'
import type { CapacityResource } from '../types'

const vehicleTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'truck', label: '卡车' },
  { value: 'ship', label: '船舶' },
]

const gpsStatusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'online', label: '在线' },
  { value: 'offline', label: '离线' },
  { value: 'abnormal', label: '异常' },
]

const qualificationOptions = [
  { value: 'all', label: '全部资质' },
  { value: 'valid', label: '资质有效' },
  { value: 'invalid', label: '资质异常' },
]

export default function Capacity() {
  const [vehicleType, setVehicleType] = useState('all')
  const [gpsStatus, setGpsStatus] = useState('all')
  const [qualification, setQualification] = useState('all')
  const [keyword, setKeyword] = useState('')

  const totalCount = mockCapacity.length
  const onlineCount = mockCapacity.filter((v) => v.gpsStatus === 'online').length
  const idleCount = mockCapacity.filter((v) => v.vehicleStatus === 'idle').length
  const abnormalCount = mockCapacity.filter(
    (v) => v.gpsStatus === 'abnormal' || v.vehicleStatus === 'maintenance'
  ).length

  const filteredData = mockCapacity.filter((item) => {
    if (vehicleType !== 'all' && item.type !== vehicleType) return false
    if (gpsStatus !== 'all' && item.gpsStatus !== gpsStatus) return false
    if (qualification === 'valid' && !item.documentsValid) return false
    if (qualification === 'invalid' && item.documentsValid) return false
    if (keyword) {
      const kw = keyword.toLowerCase()
      const name = (item.plateNo || item.shipName || '').toLowerCase()
      const driver = item.driverName.toLowerCase()
      const city = item.currentCity.toLowerCase()
      if (!name.includes(kw) && !driver.includes(kw) && !city.includes(kw)) return false
    }
    return true
  })

  const resetFilters = () => {
    setVehicleType('all')
    setGpsStatus('all')
    setQualification('all')
    setKeyword('')
  }

  const getProgressColor = (score: number) => {
    if (score >= 95) return 'green'
    if (score >= 85) return 'primary'
    if (score >= 75) return 'yellow'
    return 'red'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="运力资源管理"
        subtitle="管理和监控平台所有运输车辆与船舶资源"
        breadcrumbs={[
          { label: '工作台', icon: Home },
          { label: '运力管理' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="总运力"
          value={totalCount}
          trend={
            <span className="flex items-center gap-1 text-logistics-muted">
              <Truck className="h-3 w-3" /> 车辆 {mockCapacity.filter((v) => v.type === 'truck').length} ·{' '}
              <Ship className="h-3 w-3" /> 船舶 {mockCapacity.filter((v) => v.type === 'ship').length}
            </span>
          }
          icon={<Truck className="h-5 w-5" />}
          iconColor="bg-primary-500/15 text-primary-400"
        />
        <StatCard
          label="在线运力"
          value={onlineCount}
          trend={
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="h-3 w-3" /> 在线率 {((onlineCount / totalCount) * 100).toFixed(0)}%
            </span>
          }
          icon={<Radio className="h-5 w-5" />}
          iconColor="bg-green-500/15 text-green-400"
        />
        <StatCard
          label="空闲运力"
          value={idleCount}
          trend={
            <span className="flex items-center gap-1 text-cyan-400">
              <Clock className="h-3 w-3" /> 待调度 {idleCount} 台
            </span>
          }
          icon={<MapPin className="h-5 w-5" />}
          iconColor="bg-cyan-500/15 text-cyan-400"
        />
        <StatCard
          label="异常运力"
          value={abnormalCount}
          trend={
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" /> 需关注 {abnormalCount} 项
            </span>
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="bg-red-500/15 text-red-400"
        />
      </div>

      <Section
        title="筛选条件"
        subtitle="按类型、状态、资质等条件快速筛选运力资源"
        actions={
          <button
            onClick={resetFilters}
            className="btn-ghost flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs text-logistics-muted">关键词搜索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-logistics-muted" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="车牌号/船名/司机/城市"
                className="input w-full pl-9"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-logistics-muted">车辆类型</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="input w-full"
            >
              {vehicleTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-logistics-muted">GPS状态</label>
            <select
              value={gpsStatus}
              onChange={(e) => setGpsStatus(e.target.value)}
              className="input w-full"
            >
              {gpsStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-logistics-muted">资质状态</label>
            <select
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="input w-full"
            >
              {qualificationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section
        title="运力资源列表"
        subtitle={`共 ${filteredData.length} 条运力数据`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost">
              <FileText className="h-3.5 w-3.5" />
              导出
            </button>
            <button className="btn-primary">
              <Truck className="h-3.5 w-3.5" />
              新增运力
            </button>
          </div>
        }
      >
        <DataTable
          columns={[
            {
              key: 'name',
              title: '车牌号/船名',
              render: (row: CapacityResource) => (
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      row.type === 'truck'
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-cyan-500/15 text-cyan-400'
                    )}
                  >
                    {row.type === 'truck' ? (
                      <Truck className="h-4 w-4" />
                    ) : (
                      <Ship className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-logistics-text">
                      {row.plateNo || row.shipName || '-'}
                    </div>
                    <div className="text-xs text-logistics-muted">
                      {row.driverName} · {row.driverPhone}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'type',
              title: '类型',
              render: (row: CapacityResource) => (
                <Tag variant="primary">{row.typeLabel}</Tag>
              ),
            },
            {
              key: 'loadCapacity',
              title: '吨位',
              render: (row: CapacityResource) => (
                <div>
                  <span className="font-medium text-logistics-text">
                    {formatWeight(row.loadCapacity)}
                  </span>
                  <div className="text-xs text-logistics-muted">{row.volumeCapacity} m³</div>
                </div>
              ),
            },
            {
              key: 'currentCity',
              title: '当前位置',
              render: (row: CapacityResource) => (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-logistics-muted" />
                  <span>{row.currentCity}</span>
                </div>
              ),
            },
            {
              key: 'gpsStatus',
              title: 'GPS状态',
              align: 'center',
              render: (row: CapacityResource) => (
                <Tag variant={
                  row.gpsStatus === 'online' ? 'success' :
                  row.gpsStatus === 'abnormal' ? 'danger' : 'default'
                } dot>
                  {row.gpsStatusLabel}
                </Tag>
              ),
            },
            {
              key: 'vehicleStatus',
              title: '车辆状态',
              align: 'center',
              render: (row: CapacityResource) => (
                <Tag className={statusColor(row.vehicleStatus)} dot>
                  {row.vehicleStatusLabel}
                </Tag>
              ),
            },
            {
              key: 'performance',
              title: '履约评分',
              width: '180px',
              render: (row: CapacityResource) => (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-logistics-muted">履约分</span>
                    <span className="text-sm font-medium text-logistics-text">
                      {row.performanceScore}
                    </span>
                  </div>
                  <Progress
                    value={row.performanceScore}
                    color={getProgressColor(row.performanceScore)}
                    size="sm"
                  />
                </div>
              ),
            },
            {
              key: 'onTimeRate',
              title: '准点率',
              align: 'center',
              render: (row: CapacityResource) => (
                <div>
                  <span className="font-medium text-logistics-text">{row.onTimeRate}%</span>
                  <div className="text-xs text-logistics-muted">{row.totalOrders} 单</div>
                </div>
              ),
            },
            {
              key: 'qualification',
              title: '资质',
              align: 'center',
              render: (row: CapacityResource) => (
                <Tag
                  variant={row.documentsValid ? 'success' : 'warning'}
                  dot
                >
                  <Shield className="h-3 w-3" />
                  {row.documentsValid ? '资质有效' : '资质异常'}
                </Tag>
              ),
            },
            {
              key: 'action',
              title: '操作',
              align: 'right',
              width: '160px',
              render: () => (
                <div className="flex items-center justify-end gap-1">
                  <button className="btn-ghost !px-2 !py-1 text-xs">详情</button>
                  <button className="btn-ghost !px-2 !py-1 text-xs text-primary-400">调度</button>
                </div>
              ),
            },
          ]}
          data={filteredData}
          rowKey={(row: CapacityResource) => row.id}
          emptyText="暂无符合条件的运力数据"
        />
      </Section>
    </div>
  )
}
