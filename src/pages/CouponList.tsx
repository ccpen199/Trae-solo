import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import StatusBadge from '@/components/StatusBadge'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { Search, Filter, Plus, Eye, Edit, Pause, Play, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type TypeFilter = '' | '政务补贴' | '民生优惠' | '商业促销'
type StatusFilter = '' | 'draft' | 'active' | 'paused' | 'expired'
type StrategyFilter = '' | '人群包' | '地理围栏' | '满减触发'

const actionBadge: Record<string, { label: string; cls: string }> = {
  create: { label: '创建', cls: 'bg-green-50 text-green-700 border-green-200' },
  edit: { label: '编辑', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  save_draft: { label: '保存草稿', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  submit: { label: '提交', cls: 'bg-green-50 text-green-700 border-green-200' },
  pause: { label: '暂停', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  resume: { label: '恢复', cls: 'bg-green-50 text-green-700 border-green-200' },
  view: { label: '查看', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
}

export default function CouponList() {
  const navigate = useNavigate()
  const { couponActivities, auditLogs, changeCouponStatus, showToast } = useStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>('')
  const [auditOpen, setAuditOpen] = useState(false)

  const filtered = couponActivities.filter((a) => {
    if (search && !a.name.includes(search)) return false
    if (typeFilter && a.type !== typeFilter) return false
    if (statusFilter && a.status !== statusFilter) return false
    if (strategyFilter && a.strategy !== strategyFilter) return false
    return true
  })

  const couponLogs = auditLogs
    .filter((l) => l.targetType === 'coupon_activity')
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const handlePause = (id: string, name: string) => {
    if (!window.confirm(`确认暂停活动「${name}」？`)) return
    changeCouponStatus(id, 'paused', '管理员张明', `暂停活动「${name}」，原因：运营调整`)
    showToast('info', '活动已暂停')
  }

  const handleResume = (id: string, name: string) => {
    if (!window.confirm(`确认恢复活动「${name}」？`)) return
    changeCouponStatus(id, 'active', '管理员张明', `恢复活动「${name}」`)
    showToast('success', '活动已恢复')
  }

  const selectCls = 'px-3 py-2 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-accent/30'

  return (
    <div>
      <PageHeader
        title="券活动列表"
        description="管理所有券活动的创建、发布与暂停"
        actions={
          <button
            onClick={() => navigate('/coupon/create')}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
          >
            <Plus size={16} />
            创建活动
          </button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A99]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索活动名称..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#6B7A99]" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className={selectCls}>
              <option value="">全部类型</option>
              <option value="政务补贴">政务补贴</option>
              <option value="民生优惠">民生优惠</option>
              <option value="商业促销">商业促销</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectCls}>
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="active">进行中</option>
              <option value="paused">已暂停</option>
              <option value="expired">已过期</option>
            </select>
            <select value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value as StrategyFilter)} className={selectCls}>
              <option value="">全部策略</option>
              <option value="人群包">人群包</option>
              <option value="地理围栏">地理围栏</option>
              <option value="满减触发">满减触发</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">活动名称</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">类型</th>
                <th className="text-right px-4 py-3 font-medium text-[#6B7A99]">面额</th>
                <th className="text-right px-4 py-3 font-medium text-[#6B7A99]">总量/已用</th>
                <th className="text-center px-4 py-3 font-medium text-[#6B7A99]">状态</th>
                <th className="text-center px-4 py-3 font-medium text-[#6B7A99]">发放策略</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">时间</th>
                <th className="text-center px-4 py-3 font-medium text-[#6B7A99]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border hover:bg-bg/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">
                    <div className="flex items-center gap-2">
                      {a.name}
                      {a.status === 'draft' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          草稿
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7A99]">{a.type}</td>
                  <td className="px-4 py-3 text-right">¥{a.faceValue}</td>
                  <td className="px-4 py-3 text-right">
                    <span>{a.usedCount.toLocaleString()}</span>
                    <span className="text-[#6B7A99]"> / {a.totalCount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-center text-[#6B7A99]">{a.strategy}</td>
                  <td className="px-4 py-3 text-[#6B7A99] text-xs">{a.startDate} ~ {a.endDate}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => navigate(`/coupon/edit/${a.id}?mode=view`)}
                        className="p-1.5 rounded-md hover:bg-bg text-[#6B7A99] hover:text-primary transition-colors"
                        title="查看"
                      >
                        <Eye size={15} />
                      </button>
                      {(a.status === 'draft' || a.status !== 'expired') && (
                        <button
                          onClick={() => navigate(`/coupon/edit/${a.id}`)}
                          className="p-1.5 rounded-md hover:bg-bg text-[#6B7A99] hover:text-primary transition-colors"
                          title="编辑"
                        >
                          <Edit size={15} />
                        </button>
                      )}
                      {a.status === 'active' && (
                        <button
                          onClick={() => handlePause(a.id, a.name)}
                          className="p-1.5 rounded-md hover:bg-bg text-[#6B7A99] hover:text-yellow-600 transition-colors"
                          title="暂停"
                        >
                          <Pause size={15} />
                        </button>
                      )}
                      {a.status === 'paused' && (
                        <button
                          onClick={() => handleResume(a.id, a.name)}
                          className="p-1.5 rounded-md hover:bg-bg text-[#6B7A99] hover:text-green-600 transition-colors"
                          title="恢复"
                        >
                          <Play size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-[#6B7A99] text-sm">暂无匹配的活动数据</div>
        )}
      </Card>

      <Card className="mt-4" padding={false}>
        <button
          onClick={() => setAuditOpen(!auditOpen)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-primary hover:bg-bg/30 transition-colors"
        >
          <span>操作记录</span>
          {auditOpen ? <ChevronUp size={16} className="text-[#6B7A99]" /> : <ChevronDown size={16} className="text-[#6B7A99]" />}
        </button>

        {auditOpen && (
          <div className="border-t border-border">
            {couponLogs.length === 0 ? (
              <div className="py-8 text-center text-[#6B7A99] text-sm">暂无操作记录</div>
            ) : (
              <div className="divide-y divide-border">
                {couponLogs.map((log) => {
                  const badge = actionBadge[log.action]
                  return (
                    <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                      <span className="shrink-0 mt-0.5 text-xs text-[#6B7A99] whitespace-nowrap">{log.timestamp}</span>
                      <span className="shrink-0 text-xs text-[#6B7A99]">{log.operator}</span>
                      {badge && (
                        <span className={cn('shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border', badge.cls)}>
                          {badge.label}
                        </span>
                      )}
                      <span className="text-sm text-primary">{log.detail}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
