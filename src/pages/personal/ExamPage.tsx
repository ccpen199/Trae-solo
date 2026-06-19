import { motion } from 'framer-motion'
import { UserPlus, FileText } from 'lucide-react'
import { examList } from '@/mocks/data'

const statusConfig: Record<
  string,
  { label: string; badge: string }
> = {
  open: { label: '报名中', badge: 'gov-badge-green' },
  closed: { label: '已截止', badge: 'gov-badge-gray' },
  upcoming: { label: '即将开放', badge: 'gov-badge-blue' },
}

export default function ExamPage() {
  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">人事考试报名</h1>

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
