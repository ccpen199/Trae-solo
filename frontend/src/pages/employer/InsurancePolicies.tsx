import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Download,
  FileText,
  Calendar,
  ChevronRight,
  Plus,
  Clock,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import Empty from '../../components/ui/Empty'
import { getPolicies, type InsurancePolicy } from '../../services/insurance.api'

const mockPolicies: InsurancePolicy[] = [
  {
    id: '1',
    policyNo: 'PICC202401150001',
    productId: 'cargo',
    productName: '货物运输险',
    orderId: 'order-001',
    premium: 28,
    coverage: 50000,
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2025-01-14',
  },
  {
    id: '2',
    policyNo: 'PICC202401100002',
    productId: 'liability',
    productName: '雇主责任险',
    orderId: 'order-002',
    premium: 128,
    coverage: 200000,
    status: 'active',
    startDate: '2024-01-10',
    endDate: '2024-07-09',
  },
  {
    id: '3',
    policyNo: 'PICC202312010003',
    productId: 'accident',
    productName: '人身意外险',
    orderId: 'order-003',
    premium: 58,
    coverage: 100000,
    status: 'expired',
    startDate: '2023-12-01',
    endDate: '2023-12-31',
  },
]

export default function InsurancePolicies() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => getPolicies(),
    initialData: { list: mockPolicies, total: mockPolicies.length },
  })

  const statusConfig = {
    active: { label: '保障中', color: 'green' as const, icon: ShieldCheck },
    expired: { label: '已过期', color: 'gray' as const, icon: Shield },
    claimed: { label: '已理赔', color: 'yellow' as const, icon: ShieldAlert },
  }

  const productColors: Record<string, string> = {
    cargo: 'from-blue-500 to-cyan-500',
    liability: 'from-purple-500 to-pink-500',
    accident: 'from-orange-500 to-red-500',
  }

  const activeCount = data.list.filter((p) => p.status === 'active').length
  const totalCoverage = data.list.reduce((sum, p) => sum + (p.status === 'active' ? p.coverage : 0), 0)

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
          <h1 className="text-lg font-bold text-gray-900 ml-2">我的保单</h1>
        </div>
      </div>

      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-5 text-white mb-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">我的保障</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold">¥{totalCoverage.toLocaleString()}</div>
                <div className="text-xs opacity-80 mt-1">总保额</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{activeCount}</div>
                <div className="text-xs opacity-80 mt-1">有效保单</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">全部保单</h2>
          <button
            onClick={() => navigate('/insurance/claim')}
            className="text-sm text-blue-600 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            申请理赔
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} padded={false}>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-100 rounded w-1/2 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                  <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        ) : data.list.length === 0 ? (
          <Empty
            title="暂无保单"
            description="完成订单时可选择购买保险服务"
          />
        ) : (
          <div className="space-y-3">
            {data.list.map((policy, idx) => {
              const status = statusConfig[policy.status]
              const StatusIcon = status.icon
              return (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card padded={false} className="overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${productColors[policy.productId] || 'from-blue-500 to-cyan-500'}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${productColors[policy.productId] || 'from-blue-500 to-cyan-500'} flex items-center justify-center`}>
                            <Shield className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-800">{policy.productName}</h3>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{policy.policyNo}</p>
                          </div>
                        </div>
                        <Tag color={status.color} size="sm" icon={<StatusIcon className="w-3 h-3 mr-0.5" />}>
                          {status.label}
                        </Tag>
                      </div>

                      <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-gray-50 mb-4">
                        <div>
                          <div className="text-xs text-gray-500">保额</div>
                          <div className="text-base font-bold text-gray-800 mt-0.5">¥{policy.coverage.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">保费</div>
                          <div className="text-base font-bold text-gray-800 mt-0.5">¥{policy.premium}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">有效期</div>
                          <div className="text-sm font-bold text-gray-800 mt-0.5 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {policy.status === 'active' ? '有效' : '已过期'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{policy.startDate} ~ {policy.endDate}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Download className="w-4 h-4" />}
                          fullWidth
                        >
                          电子保单
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<FileText className="w-4 h-4" />}
                          fullWidth
                          onClick={() => navigate('/insurance/claim')}
                        >
                          申请理赔
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-800">中国人保承保</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                所有保单由中国人民财产保险股份有限公司承保，理赔流程透明高效，最快3个工作日到账。
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
