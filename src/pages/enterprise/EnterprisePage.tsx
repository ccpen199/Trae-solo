import { Link } from 'react-router-dom'
import { Users, FileText, FileCheck, ShieldCheck, CheckCircle2, XCircle, Building2, UserCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { employeeDeclarations } from '@/mocks/data'
import StatusBadge from '@/components/ui/StatusBadge'
import { useAppStore } from '@/stores/appStore'

const services = [
  {
    title: '参保增减员申报',
    icon: Users,
    desc: '批量导入员工信息，在线办理增减员申报（已授权经办范围）',
    link: '/enterprise/insurance-declaration',
    color: 'bg-gov-blue',
  },
  {
    title: '失业金申领预审',
    icon: FileText,
    desc: '申领条件自动校验，材料预审（已授权经办范围）',
    link: '/enterprise/unemployment',
    color: 'bg-gov-red',
  },
  {
    title: '电子合同存证',
    icon: FileCheck,
    desc: '区块链存证，合同验真查询（已授权经办范围）',
    link: '/enterprise/e-contract',
    color: 'bg-gov-gold',
  },
]

const hrPermissions = [
  { label: '员工参保增减员申报', authorized: true },
  { label: '失业金申领预审', authorized: true },
  { label: '劳动关系电子合同存证', authorized: true },
  { label: '企业社保缴费基数调整', authorized: false, note: '需法人二次授权' },
  { label: '企业年金管理', authorized: false, note: '需法人二次授权' },
]

const statusCounts = {
  pending: employeeDeclarations.filter((d) => d.status === 'pending').length,
  submitted: employeeDeclarations.filter((d) => d.status === 'submitted').length,
  approved: employeeDeclarations.filter((d) => d.status === 'approved').length,
  rejected: employeeDeclarations.filter((d) => d.status === 'rejected').length,
}

const summaryItems = [
  { label: '待提交', count: statusCounts.pending, status: 'pending' as const },
  { label: '已提交', count: statusCounts.submitted, status: 'submitted' as const },
  { label: '已通过', count: statusCounts.approved, status: 'approved' as const },
  { label: '已驳回', count: statusCounts.rejected, status: 'rejected' as const },
]

export default function EnterprisePage() {
  const userInfo = useAppStore((s) => s.userInfo)

  return (
    <div className="space-y-8">
      <h1 className="gov-section-title">企业服务大厅</h1>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="gov-card p-5 border-l-4 border-l-gov-blue">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gov-blue w-10 h-10 rounded-full flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gov-text text-base">企业授权信息</h2>
              <p className="text-xs text-gov-text-secondary">法人授权经办，权限范围内在线办理</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gov-text-secondary shrink-0">企业名称</span>
              <span className="font-medium text-gov-text">江苏信达科技有限公司</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-text-secondary shrink-0">统一社会信用代码</span>
              <span className="font-mono text-gov-text">91320************3X</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-text-secondary shrink-0">法人代表</span>
              <span className="text-gov-text">王建国</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-text-secondary shrink-0">法人授权状态</span>
              <span className="gov-badge-green">
                <ShieldCheck className="w-3 h-3 mr-1" />
                已授权
              </span>
              <span className="text-xs text-gov-text-secondary">（授权日期 2025-12-15）</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-text-secondary shrink-0">经办人</span>
              <span className="flex items-center gap-1 text-gov-text">
                <UserCheck className="w-3.5 h-3.5 text-gov-blue" />
                {userInfo?.name ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-text-secondary shrink-0">授权有效期</span>
              <span className="text-gov-text">2026-01-01 至 2026-12-31</span>
            </div>
          </div>
          <div className="border-t border-gov-border pt-3 mt-1">
            <p className="text-sm text-gov-text-secondary mb-2">HR权限范围</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              {hrPermissions.map((perm) => (
                <div key={perm.label} className="flex items-center gap-1.5 text-sm">
                  {perm.authorized ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                  <span className={perm.authorized ? 'text-gov-text' : 'text-gov-text-secondary'}>
                    {perm.label}
                  </span>
                  {!perm.authorized && perm.note && (
                    <span className="text-xs text-amber-600">（{perm.note}）</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={service.link} className="block">
              <div className="gov-card p-6 hover:shadow-gov-md cursor-pointer border-l-4 border-l-emerald-500">
                <div className="flex items-start gap-4">
                  <div
                    className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0`}
                  >
                    <service.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gov-text text-lg">
                        {service.title}
                      </h3>
                      <span className="gov-badge-green">已授权·可办理</span>
                    </div>
                    <p className="text-sm text-gov-text-secondary mt-1">
                      {service.desc}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="gov-card p-6">
        <h2 className="font-semibold text-gov-text mb-4">
          江苏信达科技有限公司 近期申报概况
        </h2>
        <div className="grid grid-cols-4 gap-6">
          {summaryItems.map((item) => (
            <div key={item.status} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <StatusBadge status={item.status} type="declaration" />
              </div>
              <p className="text-3xl font-mono font-bold text-gov-text">
                {item.count}
              </p>
              <p className="text-sm text-gov-text-secondary mt-1">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
