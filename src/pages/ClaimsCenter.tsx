import { useAppStore } from '@/store'
import {
  FileWarning, Upload, FileText, Send, CheckCircle2, Clock,
  Search, Filter, Plus, ArrowLeft, Eye, AlertCircle, User, Phone,
  ChevronRight, AlertTriangle,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ClaimsCenter() {
  const { claims, insurancePolicies } = useAppStore()

  const statusColor: Record<string, string> = {
    submitted: 'bg-amber-50 text-amber-600',
    reviewing: 'bg-blue-50 text-blue-600',
    approved: 'bg-success-50 text-success-600',
    rejected: 'bg-accent-50 text-accent-600',
    paid: 'bg-gradient-to-r from-success-500 to-emerald-500 text-white',
  }
  const statusLabel: Record<string, string> = {
    submitted: '已提交',
    reviewing: '审核中',
    approved: '已批准',
    rejected: '已拒赔',
    paid: '已赔付',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/insurance" className="w-9 h-9 rounded-lg bg-white border border-slate2-100 text-slate2-500 hover:bg-slate2-50 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate2-800">理赔申请中心</h2>
          <p className="text-xs text-slate2-400">中国人保货物险理赔 · 在线提交 · 进度可查 · 快速到账</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate2-400" />
            <input placeholder="搜索理赔号/保单号" className="w-56 h-9 pl-9 pr-3 rounded-lg bg-slate2-50 border border-transparent text-xs focus:outline-none focus:bg-white focus:border-primary-300 transition-all" />
          </div>
          <button className="h-9 px-3 rounded-lg bg-slate2-50 border border-transparent text-xs text-slate2-600 hover:bg-white hover:border-slate2-200 transition-colors flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            筛选
          </button>
          <button className="h-9 px-4 rounded-lg bg-gradient-to-r from-accent-500 to-red-500 text-white text-xs font-bold hover:shadow-lg hover:shadow-accent-500/25 transition-all flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            新建理赔申请
          </button>
        </div>
      </div>

      {/* 理赔统计 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { k: 'total', label: '累计申请', count: claims.length, sum: '¥80,500', icon: FileText, color: 'from-primary-500 to-primary-600' },
          { k: 'processing', label: '处理中', count: claims.filter(c => ['submitted', 'reviewing'].includes(c.status)).length, sum: '¥68,000', icon: Clock, color: 'from-amber-500 to-orange-500' },
          { k: 'approved', label: '已批准', count: claims.filter(c => ['approved', 'paid'].includes(c.status)).length, sum: '¥12,500', icon: CheckCircle2, color: 'from-success-500 to-emerald-600' },
          { k: 'rate', label: '获赔率', count: '87.5', unit: '%', icon: AlertCircle, color: 'from-violet-500 to-indigo-600' },
          { k: 'speed', label: '平均结案', count: '3.2', unit: '天', icon: Send, color: 'from-[#C8102E] to-red-600' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="card-base p-4 card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] text-slate2-400 font-medium">{item.label}</div>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono text-slate2-800 tracking-tight">{item.count}{item.unit || ''}</span>
              </div>
              {item.sum && <div className="mt-1 text-[10px] text-slate2-400 font-mono">涉及金额 {item.sum}</div>}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧列表 */}
        <div className="col-span-12 lg:col-span-7">
          <div className="card-base overflow-hidden">
            <div className="px-5 py-4 border-b border-slate2-100 bg-gradient-to-r from-slate2-50 to-transparent">
              <h3 className="font-bold text-slate2-800 text-sm flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-accent-500" />
                理赔申请列表
              </h3>
            </div>
            <div className="divide-y divide-slate2-50">
              {claims.map((c, idx) => (
                <div key={c.id} className="p-5 hover:bg-slate2-50/60 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate2-700">赔案号: {c.claimNo}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor[c.status]}`}>
                          {statusLabel[c.status]}
                        </span>
                      </div>
                      <div className="text-xs text-slate2-400 font-mono">关联保单: {c.policyNo}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate2-400 mb-0.5">申请赔付</div>
                      <div className="text-xl font-extrabold font-mono text-accent-600">¥{c.amount.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-r from-accent-50/40 to-white border border-accent-100/50 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-slate2-700 leading-relaxed">{c.reason}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-4 text-slate2-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {c.documents.length} 份材料
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        提交: {c.submittedAt.slice(5, 16)}
                      </span>
                      {c.handler && (
                        <span className="flex items-center gap-1 text-primary-600">
                          <User className="w-3 h-3" />
                          {c.handler} 处理中
                        </span>
                      )}
                      {c.paidAt && (
                        <span className="flex items-center gap-1 text-success-600">
                          <CheckCircle2 className="w-3 h-3" />
                          到账: {c.paidAt.slice(5, 16)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="px-3 py-1.5 rounded-md bg-slate2-50 text-slate2-500 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        查看
                      </button>
                      {c.status === 'submitted' && (
                        <button className="px-3 py-1.5 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          补充材料
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mt-4 pt-3 border-t border-slate2-50">
                    <div className="flex items-center justify-between">
                      {['提交申请', '材料审核', '损失核定', '赔付审批', '赔款到账'].map((s, i, arr) => {
                        const currentStage = c.status === 'submitted' ? 0 : c.status === 'reviewing' ? 1 : c.status === 'approved' ? 3 : c.status === 'paid' ? 4 : 2
                        const active = i <= currentStage
                        return (
                          <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                active ? (i === currentStage ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white animate-pulse' : 'bg-success-500 text-white') : 'bg-slate2-100 text-slate2-400'
                              }`}>
                                {active && i < currentStage ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                              </div>
                              <span className={`mt-1.5 text-[10px] font-medium ${active ? 'text-slate2-700' : 'text-slate2-300'}`}>{s}</span>
                            </div>
                            {i < arr.length - 1 && (
                              <div className={`h-0.5 flex-1 mx-1 -mt-3 ${i < currentStage ? 'bg-gradient-to-r from-success-400 to-success-500' : 'bg-slate2-100'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：新建表单 + 客服 */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* 新建理赔 */}
          <div className="card-base p-5">
            <h3 className="font-bold text-slate2-800 mb-4 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4 text-accent-500" />
              快速发起理赔申请
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">选择关联保单</label>
                <select className="w-full h-10 px-3 rounded-lg bg-slate2-50 border border-slate2-100 text-xs focus:outline-none focus:bg-white focus:border-accent-300 transition-all cursor-pointer">
                  <option>选择需要理赔的保单...</option>
                  {insurancePolicies.filter(p => ['active', 'claimed'].includes(p.status)).map(p => (
                    <option key={p.id} value={p.id}>{p.policyNo} - {p.cargoName} (¥{(p.coverageAmount / 10000).toFixed(0)}万保额)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">赔付金额 (元)</label>
                <input type="number" placeholder="请输入预估损失金额" className="w-full h-10 px-3 rounded-lg bg-white border border-slate2-200 text-sm font-mono font-bold focus:outline-none focus:border-accent-300 focus:ring-2 focus:ring-accent-50 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">事故/损失详细描述</label>
                <textarea rows={3} placeholder="请详细说明事故经过、损失情况、已采取措施等..." className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate2-200 text-xs focus:outline-none focus:border-accent-300 focus:ring-2 focus:ring-accent-50 transition-all resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">上传证明材料</label>
                <div className="border-2 border-dashed border-slate2-200 rounded-xl p-6 text-center hover:border-accent-300 hover:bg-accent-50/20 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate2-300" />
                  <p className="text-xs text-slate2-500 mb-0.5">点击或拖拽文件到此处</p>
                  <p className="text-[10px] text-slate2-400">支持 JPG/PDF 格式，事故认定书、货损照片、检测报告等</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {['事故认定书.pdf', '现场照片-1.jpg', '损失清单.xlsx'].map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success-50 text-success-600 text-[10px]">
                      <FileText className="w-3 h-3" />
                      {f}
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-red-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-accent-500/25 transition-all flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                提交理赔申请
              </button>
            </div>
          </div>

          {/* 理赔联系 */}
          <div className="card-base p-5 bg-gradient-to-br from-[#C8102E]/5 via-white to-transparent">
            <h3 className="font-bold text-slate2-800 mb-4 flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-[#C8102E]" />
              人保理赔专员
            </h3>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate2-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C8102E] to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                李
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-slate2-800">李经理</div>
                <div className="text-[11px] text-slate2-500">中国人保 · 高级理赔专员 · 8年经验</div>
                <div className="text-[11px] text-primary-500 mt-0.5 font-medium">服务过 326+ 企业客户</div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C8102E] to-red-500 text-white text-xs font-bold hover:shadow-md transition-all flex items-center gap-1">
                <Phone className="w-3 h-3" />
                联系
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate2-50">
                <div className="text-[10px] text-slate2-400">24h理赔热线</div>
                <div className="text-sm font-bold font-mono text-slate2-800">95518</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate2-50">
                <div className="text-[10px] text-slate2-400">专线客户经理</div>
                <div className="text-sm font-bold font-mono text-slate2-800">400-xxx</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
