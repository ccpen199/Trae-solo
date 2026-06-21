import { useAppStore } from '@/store'
import {
  FileCheck, Shield, User, Phone, MapPin, CalendarClock, Download, Eye,
  FileWarning, Clock, CheckCircle2, Package, ChevronRight, ArrowLeft,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import type { InsurancePolicy } from '@/types'

const statusInfo: Record<InsurancePolicy['status'], { label: string; className: string }> = {
  pending: { label: '待生效', className: 'bg-amber-50 text-amber-600' },
  active: { label: '保障中', className: 'bg-success-50 text-success-600' },
  expired: { label: '已过期', className: 'bg-slate2-100 text-slate2-500' },
  claimed: { label: '理赔中', className: 'bg-accent-50 text-accent-600' },
}

const typeLabels: Record<string, { label: string }> = {
  basic: { label: '基本险' },
  comprehensive: { label: '综合险' },
  all_risk: { label: '一切险' },
}

export default function InsurancePolicies() {
  const { insurancePolicies } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/insurance" className="w-9 h-9 rounded-lg bg-white border border-slate2-100 text-slate2-500 hover:bg-slate2-50 transition-colors flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate2-800">电子保单管理</h2>
          <p className="text-xs text-slate2-400">中国人保货物运输电子保单 · 区块链存证 · 具备法律效力</p>
        </div>
      </div>

      {/* 统计条 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '保障中', count: insurancePolicies.filter(p => p.status === 'active').length, color: 'success' },
          { label: '待生效', count: insurancePolicies.filter(p => p.status === 'pending').length, color: 'amber' },
          { label: '理赔中', count: insurancePolicies.filter(p => p.status === 'claimed').length, color: 'accent' },
          { label: '已过期', count: insurancePolicies.filter(p => p.status === 'expired').length, color: 'slate2' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-xl border-${s.color}-100 bg-${s.color}-50/50`}>
            <div className={`text-[11px] text-${s.color}-600 font-medium mb-1`}>{s.label}</div>
            <div className={`text-3xl font-extrabold font-mono text-${s.color}-700`}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* 保单卡片列表 */}
      <div className="space-y-4">
        {insurancePolicies.map((p) => (
          <div key={p.id} className="card-base overflow-hidden card-hover">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* 左侧保单主视觉 */}
              <div className="md:col-span-5 relative overflow-hidden bg-gradient-to-br from-[#C8102E] via-[#E4002B] to-[#8B0000] text-white p-6">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/10 rounded-full translate-y-1/3 -translate-x-1/3" />
                <div className="absolute top-4 right-4 opacity-60">
                  <Shield className="w-16 h-16 text-yellow-300/40" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                      <FileCheck className="w-5 h-5 text-yellow-200" />
                    </div>
                    <div>
                      <div className="text-[10px] opacity-80">PICC 中国人保</div>
                      <div className="text-xs font-bold tracking-wide">国内货物运输保险</div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="text-[10px] opacity-70 mb-1">POLICY NO. 保单号</div>
                    <div className="text-lg font-mono font-bold tracking-wider">{p.policyNo}</div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div>
                      <div className="text-[10px] opacity-70 mb-0.5">被保险货物</div>
                      <div className="text-sm font-bold">{p.cargoName}</div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur">
                        {typeLabels[p.insuranceType].label}
                      </span>
                      <span className="opacity-80 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {p.route}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/15">
                    <div>
                      <div className="text-[10px] opacity-70 mb-0.5">保险金额</div>
                      <div className="text-xl font-extrabold font-mono">¥{(p.coverageAmount / 10000).toFixed(0)}万</div>
                    </div>
                    <div>
                      <div className="text-[10px] opacity-70 mb-0.5">已缴保费</div>
                      <div className="text-xl font-extrabold font-mono">¥{p.premium.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧详细信息 */}
              <div className="md:col-span-7 p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo[p.status].className}`}>
                        {p.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />}
                        {statusInfo[p.status].label}
                      </span>
                      <span className="text-xs text-slate2-400 font-mono">关联: {p.cargoOrderNo}</span>
                    </div>
                    <div className="text-sm text-slate2-500">
                      承保机构: <span className="font-medium text-slate2-700">{p.insurer}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="p-2.5 rounded-lg bg-slate2-50 text-slate2-500 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="查看保单">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 rounded-lg bg-slate2-50 text-slate2-500 hover:bg-[#C8102E]/10 hover:text-[#C8102E] transition-colors" title="下载PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    {p.status === 'active' && (
                      <Link
                        to="/insurance/claims"
                        className="flex items-center gap-1 px-3.5 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold transition-colors"
                      >
                        <FileWarning className="w-4 h-4" />
                        申请理赔
                      </Link>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <InfoBlock icon={<Package className="w-3.5 h-3.5" />} label="货物价值">
                    <span className="font-mono text-slate2-700">¥{(p.cargoValue / 10000).toFixed(0)}万</span>
                  </InfoBlock>
                  <InfoBlock icon={<Shield className="w-3.5 h-3.5" />} label="货物重量">
                    <span className="font-mono text-slate2-700">{p.weight.toLocaleString()} kg</span>
                  </InfoBlock>
                  <InfoBlock icon={<CalendarClock className="w-3.5 h-3.5" />} label="生效日期">
                    <span className="font-mono text-success-600 text-xs">{p.startDate.slice(5, 16)}</span>
                  </InfoBlock>
                  <InfoBlock icon={<Clock className="w-3.5 h-3.5" />} label="到期日期">
                    <span className="font-mono text-accent-600 text-xs">{p.endDate.slice(5, 16)}</span>
                  </InfoBlock>
                </div>

                {p.claimant && (
                  <div className="p-3 rounded-xl bg-slate2-50 border border-slate2-100">
                    <div className="text-[11px] font-semibold text-slate2-500 mb-1.5">投保人信息</div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-slate2-600">
                        <User className="w-3 h-3 text-primary-500" />
                        {p.claimant.name}
                      </span>
                      <span className="flex items-center gap-1 text-slate2-600">
                        <Phone className="w-3 h-3 text-primary-500" />
                        <span className="font-mono">{p.claimant.phone}</span>
                      </span>
                    </div>
                  </div>
                )}

                {p.status === 'claimed' && p.claim && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-accent-50 to-white border border-accent-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileWarning className="w-4 h-4 text-accent-500" />
                        <span className="text-xs font-bold text-accent-700">理赔进度: {p.claim.status.toUpperCase()}</span>
                      </div>
                      <Link to="/insurance/claims" className="text-xs text-accent-600 font-medium flex items-center gap-0.5">
                        查看详情 <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <div className="text-slate2-400 mb-0.5">申请金额</div>
                        <div className="font-mono font-bold text-accent-700">¥{p.claim.amount?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate2-400 mb-0.5">申请时间</div>
                        <div className="font-mono text-slate2-700">{p.claim.submittedAt.slice(5, 16)}</div>
                      </div>
                      <div>
                        <div className="text-slate2-400 mb-0.5">附证材料</div>
                        <div className="font-mono text-slate2-700">{p.claim.documents.length} 份</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoBlock({ icon, label, children }: { icon: any; label: string; children: any }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-slate2-400 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold">{children}</div>
    </div>
  )
}
