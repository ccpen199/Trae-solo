import { Link } from 'react-router-dom'
import { Shield, Heart, GraduationCap, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { insuranceAccounts, insuranceTypeLabels, insuranceTypeColors } from '@/mocks/data'

const services = [
  {
    title: '五险一金查询',
    icon: Shield,
    desc: '实时查询养老/医疗/失业/工伤/生育保险及住房公积金',
    link: '/personal/social-insurance',
    color: 'bg-gov-blue',
  },
  {
    title: '医保就医记录',
    icon: Heart,
    desc: '就诊记录/定点医院/药品目录/报销比例',
    link: '/personal/medical',
    color: 'bg-[#2E86AB]',
  },
  {
    title: '人事考试报名',
    icon: GraduationCap,
    desc: '考试公告/在线报名/准考证打印',
    link: '/personal/exam',
    color: 'bg-gov-gold',
  },
  {
    title: '电子社保卡',
    icon: CreditCard,
    desc: '卡面展示/申领/二维码/NFC闪付',
    link: '/personal/essc',
    color: 'bg-gov-red',
  },
]

export default function PersonalPage() {
  const activeInsurances = insuranceAccounts.filter(
    (a) => a.status === 'active'
  )

  return (
    <div className="space-y-8">
      <h1 className="gov-section-title">个人服务大厅</h1>

      <div className="grid grid-cols-2 gap-6">
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
        <h2 className="font-semibold text-gov-text mb-4">参保险种状态</h2>
        <div className="flex flex-wrap gap-3">
          {activeInsurances.map((account) => (
            <span key={account.insuranceType} className="gov-badge-green">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{
                  backgroundColor:
                    insuranceTypeColors[account.insuranceType],
                }}
              />
              {insuranceTypeLabels[account.insuranceType]}：正常参保
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
