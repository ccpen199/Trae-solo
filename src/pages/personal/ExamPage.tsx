import { motion } from 'framer-motion'
import { UserPlus, FileText, ShieldCheck, ShieldAlert, RefreshCw, Database } from 'lucide-react'
import { examList } from '@/mocks/data'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  string,
  { label: string; badge: string }
> = {
  open: { label: '报名中', badge: 'gov-badge-green' },
  closed: { label: '已截止', badge: 'gov-badge-gray' },
  upcoming: { label: '即将开放', badge: 'gov-badge-blue' },
}

export default function ExamPage() {
  const { userInfo, isLoggedIn } = useAppStore()

  const maskIdNumber = (id: string) => {
    if (!id || id.length < 8) return id
    return id.slice(0, 4) + '****' + id.slice(-4)
  }

  const getAuthLevelBadge = (riskLevel: string) => {
    if (riskLevel === 'low') {
      return { label: 'L3 强认证', className: 'gov-badge-green' }
    }
    return { label: 'L2 基础认证', className: 'gov-badge-gold' }
  }

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">人事考试报名</h1>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          'rounded-lg border py-3 px-4 text-sm',
          isLoggedIn
            ? 'bg-gov-bg-light/80 border-gov-border'
            : 'bg-amber-50 border-amber-200'
        )}
      >
        {isLoggedIn && userInfo ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-gov-text">
                  {userInfo.name}
                </span>
              </div>
              <span className="text-gov-text-muted">●</span>
              <span className="font-mono text-gov-text-secondary">
                {maskIdNumber(userInfo.idNumber)}
              </span>
              <span className="text-gov-text-muted">●</span>
              <span className={getAuthLevelBadge(userInfo.riskLevel).className}>
                {getAuthLevelBadge(userInfo.riskLevel).label}
              </span>
              <span className="text-gov-text-muted">●</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-gov-text-secondary">正常参保</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-gov-text-muted text-xs">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                金保工程已同步
              </span>
              <span className="text-gov-border">|</span>
              <a
                href="/login?role=personal"
                className="text-gov-blue hover:text-gov-blue-light transition-colors inline-flex items-center gap-1 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                重新核验
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800">请先登录认证</span>
            </div>
            <a
              href="/login?role=personal"
              className="gov-btn-primary !py-1.5 !px-4 text-xs"
            >
              去登录
            </a>
          </div>
        )}
      </motion.div>

      <div className="gov-card overflow-hidden">
        <table className="gov-table">
          <thead>
            <tr>
              <th>考试名称</th>
              <th>类别</th>
              <th>报名时间</th>
              <th>考试时间</th>
              <th>报名人数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {examList.map((exam, index) => {
              const config = statusConfig[exam.status]
              return (
                <motion.tr
                  key={exam.examId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="font-medium text-gov-text">{exam.name}</td>
                  <td>
                    <span className="gov-badge-gold">{exam.category}</span>
                  </td>
                  <td className="text-sm">
                    {exam.registrationStart} ~ {exam.registrationEnd}
                  </td>
                  <td className="text-sm">{exam.examDate}</td>
                  <td className="font-mono">
                    {exam.registeredCount.toLocaleString()}
                  </td>
                  <td>
                    <span className={config.badge}>{config.label}</span>
                  </td>
                  <td>
                    {exam.status === 'open' && (
                      <button className="gov-btn-primary text-sm py-1.5 px-4 inline-flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" />
                        立即报名
                      </button>
                    )}
                    {exam.status === 'closed' && (
                      <a
                        href="#"
                        className="text-gov-blue text-sm hover:underline inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        查看准考证
                      </a>
                    )}
                    {exam.status === 'upcoming' && (
                      <span className="gov-badge-gray">待开放</span>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
