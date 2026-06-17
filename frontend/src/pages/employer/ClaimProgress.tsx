import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  Check,
  ShieldCheck,
  Download,
  Phone,
  Clock,
  DollarSign,
  Banknote,
  Building2,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import { getClaimDetail, type ClaimDetail } from '../../services/insurance.api'

const mockClaim: ClaimDetail = {
  id: '1',
  claimNo: 'CLM202401160001',
  policyId: '1',
  orderId: 'order-001',
  type: 'cargo_damage',
  amount: 5000,
  status: 'reviewing',
  description: '运输过程中玻璃桌面破碎，桌面出现5cm裂纹，桌腿轻微变形',
  evidenceImages: ['img1', 'img2', 'img3'],
  timeline: [
    { status: '已报案', time: '2024-01-16 09:30:00', remark: '您已提交理赔申请' },
    { status: '审核中', time: '2024-01-16 10:15:00', remark: '理赔专员已受理，正在审核材料' },
    { status: '调查中', time: '', remark: '等待现场核实' },
    { status: '已赔付', time: '', remark: '' },
    { status: '已完成', time: '', remark: '' },
  ],
  createdAt: '2024-01-16 09:30:00',
}

export default function ClaimProgress() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: claim = mockClaim } = useQuery({
    queryKey: ['claimDetail', id],
    queryFn: () => getClaimDetail(id || ''),
    initialData: mockClaim,
  })

  const claimTypeMap: Record<string, string> = {
    cargo_damage: '货损',
    personal_injury: '人伤',
    property_damage: '财产损失',
  }

  const statusConfig = {
    pending: { label: '已报案', color: 'blue' as const, step: 0 },
    reviewing: { label: '审核中', color: 'blue' as const, step: 1 },
    investigating: { label: '调查中', color: 'yellow' as const, step: 2 },
    approved: { label: '已赔付', color: 'green' as const, step: 3 },
    paid: { label: '已完成', color: 'green' as const, step: 3 },
    rejected: { label: '已拒绝', color: 'red' as const, step: -1 },
  }

  const currentStatus = statusConfig[claim.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">理赔进度</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-5 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">理赔单号</span>
              </div>
              <Tag color="blue" size="sm" className="!bg-white/20 !text-white border-0">
                {currentStatus.label}
              </Tag>
            </div>
            <p className="text-lg font-bold font-mono mb-4">{claim.claimNo}</p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <div className="text-xs opacity-80">理赔类型</div>
                <div className="text-base font-bold mt-0.5">{claimTypeMap[claim.type] || '-'}</div>
              </div>
              <div>
                <div className="text-xs opacity-80">申请金额</div>
                <div className="text-base font-bold mt-0.5">¥{claim.amount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">理赔进度</h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-100" />
            <div className="space-y-5">
              {claim.timeline.map((item, idx) => {
                const isCompleted = !!item.time
                const isCurrent = !item.time && (claim.timeline[idx - 1]?.time || idx === 0)
                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1, type: 'spring' }}
                      className={`
                        relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${isCompleted
                          ? 'bg-green-500'
                          : isCurrent
                          ? 'bg-blue-500 ring-4 ring-blue-100'
                          : 'bg-gray-200'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                          {idx + 1}
                        </span>
                      )}
                    </motion.div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${
                            isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.time && (
                          <span className="text-xs text-gray-400">{item.time.slice(5, 16)}</span>
                        )}
                      </div>
                      {item.remark && (
                        <motion.p
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 + 0.1 }}
                          className="text-xs text-gray-500 mt-1"
                        >
                          {item.remark}
                        </motion.p>
                      )}
                      {isCurrent && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2"
                        >
                          <Tag color="blue" size="sm">处理中...</Tag>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-bold text-gray-900">人保同步状态</h2>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-gray-800">中国人民财产保险</h3>
                  <Tag color="green" size="sm">已同步</Tag>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  案件已同步至人保系统，工单号 PICC-{claim.claimNo}，专员正在处理中
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-green-200/50">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">理赔专员</div>
                  <div className="text-sm font-medium text-gray-800">李经理</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">联系电话</div>
                  <div className="text-sm font-medium text-gray-800">95518</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {claim.status === 'paid' || claim.status === 'approved' ? (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-5 h-5 text-green-600" />
              <h2 className="text-base font-bold text-gray-900">赔款到账信息</h2>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500">赔付金额</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    ¥{claim.amount.toLocaleString()}
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">收款账户</span>
                  <span className="text-gray-800 font-medium">招商银行 ****8888</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">到账时间</span>
                  <span className="text-gray-800 font-medium">预计3个工作日内</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">状态</span>
                  <Tag color="green" size="sm">
                    <Check className="w-3 h-3 mr-0.5" />
                    已赔付
                  </Tag>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {claim.status === 'rejected' ? (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-gray-900">拒赔通知</h2>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
              <div className="text-sm text-red-700 leading-relaxed">
                根据保险条款，您提交的理赔申请因"不在保障范围内"被拒绝。如有疑问请联系客服。
              </div>
            </div>
          </Card>
        ) : null}

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">申请信息</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">申请时间</span>
              <span className="text-sm text-gray-800">{claim.createdAt.slice(0, 16)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">出险类型</span>
              <span className="text-sm text-gray-800">{claimTypeMap[claim.type] || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">申请金额</span>
              <span className="text-sm font-bold text-blue-600">¥{claim.amount.toLocaleString()}</span>
            </div>
            <div className="pt-2">
              <span className="text-sm text-gray-500 block mb-2">出险描述</span>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl leading-relaxed">
                {claim.description}
              </p>
            </div>
            <div className="pt-2">
              <span className="text-sm text-gray-500 block mb-2">证据照片 ({claim.evidenceImages.length}张)</span>
              <div className="grid grid-cols-4 gap-2">
                {claim.evidenceImages.map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"
                  >
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            fullWidth
          >
            电子保单
          </Button>
          <Button
            variant="primary"
            icon={<Phone className="w-4 h-4" />}
            fullWidth
          >
            联系专员
          </Button>
        </div>
      </div>
    </div>
  )
}
