import { Upload, Download, Send, Eye, Trash2, Building2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { employeeDeclarations } from '@/mocks/data'
import StatusBadge from '@/components/ui/StatusBadge'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

function maskIdNumber(id: string): string {
  if (id.length <= 10) return id
  return id.slice(0, 6) + '****' + id.slice(-4)
}

const statusCounts = {
  pending: employeeDeclarations.filter((d) => d.status === 'pending').length,
  submitted: employeeDeclarations.filter((d) => d.status === 'submitted').length,
  approved: employeeDeclarations.filter((d) => d.status === 'approved').length,
  rejected: employeeDeclarations.filter((d) => d.status === 'rejected').length,
}

export default function InsuranceDeclarationPage() {
  const userInfo = useAppStore((s) => s.userInfo)
  const isLoggedIn = useAppStore((s) => s.isLoggedIn)
  const currentRole = useAppStore((s) => s.currentRole)
  const isEnterpriseAuth = isLoggedIn && currentRole === 'enterprise' && userInfo

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">参保增减员申报</h1>

      {isEnterpriseAuth ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn(
            'rounded-lg border border-gov-blue/20 py-3 px-4',
            'bg-gradient-to-r from-emerald-50/80 via-gov-blue/5 to-gov-blue/10',
            'flex items-center justify-between text-sm'
          )}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gov-blue" />
                <span className="font-medium text-gov-text">江苏信达科技有限公司</span>
              </div>
              <span className="text-gov-text-secondary">●</span>
              <span className="font-mono text-gov-text-secondary">9132**********3X</span>
              <span className="text-gov-text-secondary">●</span>
              <span className="gov-badge-green">已授权</span>
              <span className="text-gov-text-secondary">●</span>
              <span className="text-gov-text-secondary">
                经办人: <span className="text-gov-text font-medium">{userInfo?.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-medium">法人授权有效</span>
              </div>
              <span className="text-gov-text-secondary">|</span>
              <span className="text-gov-text-secondary">有效期至 2026-12-31</span>
              <span className="text-gov-text-secondary">|</span>
              <button className="text-gov-blue hover:text-gov-blue/80 text-sm">
                查看授权范围
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn(
            'rounded-lg border border-amber-200 py-3 px-4',
            'bg-gradient-to-r from-amber-50/80 to-amber-50',
            'flex items-center gap-3 text-sm'
          )}>
            <Building2 className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700">请先企业认证后再办理业务</span>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        <button className="gov-btn-secondary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          批量导入
        </button>
        <button className="gov-btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出模板
        </button>
        <button className="gov-btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" />
          提交申报
        </button>
      </div>

      <div className="gov-card p-6 overflow-x-auto">
        <table className="gov-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>身份证号</th>
              <th>操作类型</th>
              <th>险种</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {employeeDeclarations.map((decl, index) => (
              <motion.tr
                key={decl.employeeId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="font-medium text-gov-text">{decl.name}</td>
                <td className="font-mono text-sm">
                  {maskIdNumber(decl.idNumber)}
                </td>
                <td>
                  {decl.operation === 'add' ? (
                    <span className="gov-badge-green">增员</span>
                  ) : (
                    <span className="gov-badge-red">减员</span>
                  )}
                </td>
                <td className="text-sm text-gov-text-secondary">
                  {decl.insuranceTypes.join('、')}
                </td>
                <td>
                  <StatusBadge status={decl.status} type="declaration" />
                </td>
                <td className="font-mono text-sm text-gov-text-secondary">
                  {decl.submittedAt ?? '-'}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button className="text-gov-blue hover:text-gov-blue/80 text-sm">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gov-red hover:text-gov-red/80 text-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gov-card p-6">
        <h2 className="font-semibold text-gov-text mb-4">申报统计</h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-mono font-bold text-gov-text-secondary">
              {statusCounts.pending}
            </p>
            <p className="text-sm text-gov-text-secondary mt-1">待提交</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-mono font-bold text-[#2E86AB]">
              {statusCounts.submitted}
            </p>
            <p className="text-sm text-gov-text-secondary mt-1">已提交</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-mono font-bold text-green-600">
              {statusCounts.approved}
            </p>
            <p className="text-sm text-gov-text-secondary mt-1">已通过</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-mono font-bold text-gov-red">
              {statusCounts.rejected}
            </p>
            <p className="text-sm text-gov-text-secondary mt-1">已驳回</p>
          </div>
        </div>
      </div>
    </div>
  )
}
