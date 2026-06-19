import { Link } from 'react-router-dom'
import { Users, FileText, FileCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { employeeDeclarations } from '@/mocks/data'
import StatusBadge from '@/components/ui/StatusBadge'

const services = [
  {
    title: '参保增减员申报',
    icon: Users,
    desc: '批量导入员工信息，在线办理增减员申报',
    link: '/enterprise/insurance-declaration',
    color: 'bg-gov-blue',
  },
  {
    title: '失业金申领预审',
    icon: FileText,
    desc: '申领条件自动校验，材料预审',
    link: '/enterprise/unemployment',
    color: 'bg-gov-red',
  },
  {
    title: '电子合同存证',
    icon: FileCheck,
    desc: '区块链存证，合同验真查询',
    link: '/enterprise/e-contract',
    color: 'bg-gov-gold',
  },
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
  return (
    <div className="space-y-8">
      <h1 className="gov-section-title">企业服务大厅</h1>

      <div className="grid grid-cols-3 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={service.link} className="block">
              <div className="gov-card p-6 hover:shadow-gov-md cursor-pointer">
                <div className="flex items-start gap-4">
                  <div
                    className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0`}
                  >
                    <service.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gov-text text-lg">
                      {service.title}
                    </h3>
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
        <h2 className="font-semibold text-gov-text mb-4">近期申报概况</h2>
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
