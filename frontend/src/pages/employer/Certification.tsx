import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  User,
  CreditCard,
  Car,
  Check,
  Upload,
  Camera,
  Shield,
  AlertCircle,
  Clock,
  FileCheck,
  Scan,
  Sparkles,
  IdCard,
  Phone,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import Badge from '../../components/ui/Badge'

type TabType = 'identity' | 'skill' | 'vehicle'

type CertStatus = 'pending' | 'reviewing' | 'approved' | 'rejected'

const statusMap: Record<CertStatus, { label: string; color: 'blue' | 'green' | 'yellow' | 'red'; icon: typeof Check }> = {
  pending: { label: '待提交', color: 'gray', icon: Clock as typeof Check },
  reviewing: { label: '审核中', color: 'yellow', icon: Clock as typeof Check },
  approved: { label: '已通过', color: 'green', icon: Check },
  rejected: { label: '已驳回', color: 'red', icon: AlertCircle as typeof Check },
}

export default function Certification() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('identity')
  const [idFrontUploaded, setIdFrontUploaded] = useState(true)
  const [idBackUploaded, setIdBackUploaded] = useState(true)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [faceScanning, setFaceScanning] = useState(false)
  const [identityStatus, setIdentityStatus] = useState<CertStatus>('reviewing')

  const tabs: { key: TabType; label: string; icon: typeof User }[] = [
    { key: 'identity', label: '实名认证', icon: User },
    { key: 'skill', label: '技能认证', icon: CreditCard as typeof User },
    { key: 'vehicle', label: '车辆认证', icon: Car as typeof User },
  ]

  const handleStartFaceScan = () => {
    setFaceScanning(true)
    setTimeout(() => {
      setFaceScanning(false)
    }, 3000)
  }

  const handleOcr = () => {
    setOcrProcessing(true)
    setTimeout(() => {
      setOcrProcessing(false)
    }, 2000)
  }

  const renderIdentityTab = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">身份证信息</h2>
          </div>
          <Tag color={statusMap[identityStatus].color as any} size="sm">
            {(() => {
              const StatusIcon = statusMap[identityStatus].icon
              return (
                <>
                  <StatusIcon className="w-3 h-3 mr-0.5" />
                  {statusMap[identityStatus].label}
                </>
              )
            })()}
          </Tag>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              aspect-[1.58/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
              ${idFrontUploaded
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
            onClick={() => setIdFrontUploaded(!idFrontUploaded)}
          >
            {idFrontUploaded ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mb-2">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-green-700">人像面已上传</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">上传人像面</span>
                <span className="text-[10px] mt-0.5">支持JPG/PNG，小于5MB</span>
              </div>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              aspect-[1.58/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
              ${idBackUploaded
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
            onClick={() => setIdBackUploaded(!idBackUploaded)}
          >
            {idBackUploaded ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mb-2">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-green-700">国徽面已上传</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">上传国徽面</span>
                <span className="text-[10px] mt-0.5">支持JPG/PNG，小于5MB</span>
              </div>
            )}
          </motion.div>
        </div>

        {idFrontUploaded && idBackUploaded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-2">
              <Scan className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 text-xs text-blue-700">
                {ocrProcessing ? '正在智能识别身份证信息...' : '已识别以下信息，请核对无误'}
              </div>
              {!ocrProcessing && (
                <button
                  onClick={handleOcr}
                  className="text-xs text-blue-600 font-medium hover:text-blue-700"
                >
                  重新识别
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">真实姓名</label>
                <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-800 font-medium">
                  张*明
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">身份证号</label>
                <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-800 font-mono">
                  310***********1234
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-gray-900">人脸识别</h2>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-4">
            <motion.div
              animate={faceScanning ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 2, repeat: faceScanning ? Infinity : 0, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #8b5cf6, #3b82f6, #10b981, #8b5cf6)',
                opacity: faceScanning ? 0.6 : 0,
                filter: 'blur(8px)',
              }}
            />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {faceScanning ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
                  <motion.div
                    animate={{ y: [0, 160, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="w-12 h-12 text-white" />
                    </motion.div>
                  </div>
                </div>
              ) : (
                <User className="w-16 h-16 text-gray-300" />
              )}
            </div>

            {!faceScanning && (
              <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-white">
                <Shield className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 text-center mb-1">
            {faceScanning ? '正在人脸识别，请保持面部在框内...' : '请正对手机，保持光线充足'}
          </p>
          <p className="text-xs text-gray-400 text-center mb-4">
            我们将加密存储您的面部信息，仅用于身份核验
          </p>

          <Button
            variant={faceScanning ? 'secondary' : 'primary'}
            icon={faceScanning ? undefined : <Camera className="w-4 h-4" />}
            onClick={handleStartFaceScan}
            disabled={faceScanning}
            loading={faceScanning}
          >
            {faceScanning ? '识别中...' : '开始人脸识别'}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-green-600" />
          <h2 className="text-base font-bold text-gray-900">手机号验证</h2>
        </div>
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-green-50 border border-green-100">
          <div>
            <div className="text-sm font-medium text-gray-800">138****8888</div>
            <div className="text-xs text-gray-500 mt-0.5">已完成实名认证</div>
          </div>
          <Tag color="green" size="sm">
            <Check className="w-3 h-3 mr-0.5" />
            已验证
          </Tag>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 mb-1">认证须知</h3>
            <ul className="text-xs text-gray-500 space-y-1 leading-relaxed">
              <li>• 请确保上传的身份证照片清晰、完整、无遮挡</li>
              <li>• 实名认证信息需与本人一致，否则将无法通过审核</li>
              <li>• 审核通常在1-2个工作日内完成</li>
              <li>• 您的信息将严格加密存储，仅用于身份核验</li>
            </ul>
          </div>
        </div>
      </Card>

      <Button
        variant="cta"
        size="lg"
        fullWidth
        icon={<Check className="w-5 h-5" />}
        disabled={identityStatus === 'reviewing'}
      >
        {identityStatus === 'approved' ? '已完成认证' : identityStatus === 'reviewing' ? '审核中，请耐心等待' : '提交认证'}
      </Button>
    </motion.div>
  )

  const renderSkillTab = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-orange-600" />
          <h2 className="text-base font-bold text-gray-900">技能认证</h2>
          <Badge color="yellow" dot className="ml-auto" />
        </div>
        <p className="text-sm text-gray-500 mb-4">
          技能认证主要适用于工人端用户，用于证明您的专业技能水平。
        </p>
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-orange-700 leading-relaxed">
              当前账户为雇主端账户，技能认证主要供工人端接单使用。如您需要切换为工人身份，请前往设置页面切换角色。
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-gray-800 mb-3">可认证技能（预览）</h3>
        <div className="flex flex-wrap gap-2">
          {['搬运工', '装卸工', '家具安装', '家电维修', '清洁保洁', '水电工', '木工', '瓦工', '油漆工', '拆装工'].map((skill, idx) => (
            <Tag key={idx} color={['blue', 'green', 'purple', 'orange', 'cyan'][idx % 5] as any}>
              {skill}
            </Tag>
          ))}
        </div>
      </Card>
    </motion.div>
  )

  const renderVehicleTab = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-cyan-600" />
          <h2 className="text-base font-bold text-gray-900">车辆认证</h2>
          <Badge color="yellow" dot className="ml-auto" />
        </div>
        <p className="text-sm text-gray-500 mb-4">
          车辆认证主要适用于司机端用户，用于证明您拥有合法运营的车辆。
        </p>
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-cyan-700 leading-relaxed">
              当前账户为雇主端账户，车辆认证主要供司机端接单使用。如您需要切换为司机身份，请前往设置页面切换角色。
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-gray-800 mb-3">可认证车型（预览）</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: '面包车', icon: '🚐' },
            { name: '小货车', icon: '🚚' },
            { name: '中货车', icon: '🚛' },
            { name: '大货车', icon: '🚒' },
          ].map((v, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2"
            >
              <span className="text-2xl">{v.icon}</span>
              <span className="text-sm font-medium text-gray-700">{v.name}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  )

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">认证中心</h1>
        </div>

        <div className="px-4 flex gap-1 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'identity' && (
            <div key="identity">{renderIdentityTab()}</div>
          )}
          {activeTab === 'skill' && (
            <div key="skill">{renderSkillTab()}</div>
          )}
          {activeTab === 'vehicle' && (
            <div key="vehicle">{renderVehicleTab()}</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
