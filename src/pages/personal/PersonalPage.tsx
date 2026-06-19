import { Link } from 'react-router-dom'
import { Shield, Heart, GraduationCap, CreditCard, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { insuranceAccounts, insuranceTypeLabels, insuranceTypeColors } from '@/mocks/data'
import { useAppStore } from '@/stores/appStore'

const services = [
  {
    title: '五险一金查询',
    icon: Shield,
    desc: '实时查询养老/医疗/失业/工伤/生育保险及住房公积金',
    link: '/personal/social-insurance',
    color: 'bg-gov-blue',
    sensitive: true,
  },
  {
    title: '医保就医记录',
    icon: Heart,
    desc: '就诊记录/定点医院/药品目录/报销比例',
    link: '/personal/medical',
    color: 'bg-[#2E86AB]',
    sensitive: false,
  },
  {
    title: '人事考试报名',
    icon: GraduationCap,
    desc: '考试公告/在线报名/准考证打印',
    link: '/personal/exam',
    color: 'bg-gov-gold',
    sensitive: false,
  },
  {
    title: '电子社保卡',
    icon: CreditCard,
    desc: '卡面展示/申领/二维码/NFC闪付',
    link: '/personal/essc',
    color: 'bg-gov-red',
    sensitive: true,
  },
]

function maskIdNumber(id: string) {
  if (id.length <= 10) return id
  return id.slice(0, 6) + '****' + id.slice(-4)
}

function getAuthLevelLabel(riskLevel: string) {
  switch (riskLevel) {
    case 'low':
      return 'L3 强认证'
    case 'medium':
      return 'L2 基础认证'
    case 'high':
      return '认证未通过'
    default:
      return '未知'
  }
}

function getAuthMethodLabel(authMethod: string) {
  return authMethod === 'face' ? '人脸识别' : '指纹识别'
}

function getServiceStatus(riskLevel: string | undefined, sensitive: boolean) {
  if (!riskLevel || riskLevel === 'high') {
    return { label: '待认证', badgeClass: 'gov-badge-gray', borderColor: 'border-l-gray-400' }
  }
  if (riskLevel === 'medium' && sensitive) {
    return { label: '需强认证', badgeClass: 'gov-badge-gold', borderColor: 'border-l-amber-400' }
  }
  return { label: '可办理', badgeClass: 'gov-badge-green', borderColor: 'border-l-emerald-500' }
}

export default function PersonalPage() {
  const userInfo = useAppStore((s) => s.userInfo)

  const activeInsurances = insuranceAccounts.filter(
    (a) => a.status === 'active'
  )

  const authLevelLabel = userInfo ? getAuthLevelLabel(userInfo.riskLevel) : '认证未通过'
  const authMethodLabel = userInfo ? getAuthMethodLabel(userInfo.authMethod) : '-'

  return (
    <div className="space-y-8">
      <h1 className="gov-section-title">个人服务大厅</h1>

      {userInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="gov-card p-5 border-l-4 border-l-gov-blue">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gov-blue w-10 h-10 rounded-full flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gov-text text-base">认证身份信息</h2>
                <p className="text-xs text-gov-text-secondary">已通过身份认证，身份信息与服务绑定</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gov-text-secondary shrink-0">姓名</span>
                <span className="font-medium text-gov-text">{userInfo.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-text-secondary shrink-0">身份证号</span>
                <span className="font-mono text-gov-text">{maskIdNumber(userInfo.idNumber)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-text-secondary shrink-0">认证方式</span>
                <span className="text-gov-text">{authMethodLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-text-secondary shrink-0">认证等级</span>
                <span
                  className={
                    userInfo.riskLevel === 'low'
                      ? 'text-emerald-700 font-medium'
                      : userInfo.riskLevel === 'medium'
                        ? 'text-amber-700 font-medium'
                        : 'text-red-600 font-medium'
                  }
                >
                  {authLevelLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-text-secondary shrink-0">金保工程参保状态</span>
                <span className="gov-badge-green">正常参保</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {services.map((service, index) => {
          const status = getServiceStatus(userInfo?.riskLevel, service.sensitive)
          return (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={service.link} className="block">
                <div className={`gov-card p-6 hover:shadow-gov-md cursor-pointer border-l-4 ${status.borderColor}`}>
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
                        <span className={status.badgeClass}>{status.label}</span>
                      </div>
                      <p className="text-sm text-gov-text-secondary mt-1">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <div className="gov-card p-6">
        <h2 className="font-semibold text-gov-text mb-4">
          {userInfo ? `${userInfo.name} 参保险种状态` : '参保险种状态'}
        </h2>
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
