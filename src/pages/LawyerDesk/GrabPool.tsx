import { useState, useEffect, useMemo } from 'react'
import {
  RefreshCw,
  MapPin,
  Clock,
  FileText,
  Users,
  Gavel,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '@/components/ui/Modal'
import { useConsultationStore } from '@/store/useConsultationStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { formatRelativeTime, caseTypeMap } from '@/utils/format'
import type { Consultation, LegalCaseType, Lawyer } from '@/types'

const GRAB_TIMEOUT = 15 * 60 * 1000

const caseTypeList: { value: LegalCaseType; label: string }[] = [
  { value: 'marriage', label: '婚姻家庭' },
  { value: 'labor', label: '劳动纠纷' },
  { value: 'debt', label: '债务纠纷' },
  { value: 'property', label: '房产纠纷' },
  { value: 'contract', label: '合同纠纷' },
  { value: 'traffic', label: '交通事故' },
  { value: 'criminal', label: '刑事辩护' },
  { value: 'other', label: '其他' },
]

const regionList = ['北京', '上海', '广东', '江苏', '浙江', '四川', '山东', '河南', '湖北', '福建', '天津', '河北']

interface GrabCaseCardProps {
  consultation: Consultation
  onGrab: (consultation: Consultation) => void
}

function GrabCaseCard({ consultation, onGrab }: GrabCaseCardProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const elapsed = Date.now() - consultation.createdAt
      const remaining = GRAB_TIMEOUT - elapsed
      if (remaining <= 0) {
        setIsExpired(true)
        setTimeLeft(0)
      } else {
        setTimeLeft(remaining)
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [consultation.createdAt])

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = ((GRAB_TIMEOUT - timeLeft) / GRAB_TIMEOUT) * 100
  const grabCount = Math.floor(Math.random() * 10) + 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-2xl border bg-white p-5 transition-all hover:shadow-md',
        isExpired ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:border-blue-200'
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {caseTypeMap[consultation.caseType]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
            <MapPin className="h-3 w-3" />
            {consultation.region}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(consultation.createdAt)}
        </span>
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-1">
        {consultation.title}
      </h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">
        {consultation.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
        <span className="inline-flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {consultation.evidences.length} 份证据
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {grabCount} 人已抢
        </span>
      </div>

      {!isExpired ? (
        <div className="space-y-3">
          <div className="relative">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'h-full rounded-full',
                  progress > 70 ? 'bg-red-500' : progress > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
              />
            </div>
            <div
              className={cn(
                'absolute right-0 -top-5 text-xs font-mono font-medium',
                progress > 70 ? 'text-red-600' : progress > 40 ? 'text-amber-600' : 'text-emerald-600'
              )}
            >
              {formatTimeLeft(timeLeft)}
            </div>
          </div>
          <button
            onClick={() => onGrab(consultation)}
            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Gavel className="h-4 w-4" />
            立即抢单
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-2.5 text-slate-400 text-sm bg-slate-50 rounded-xl">
          <X className="h-4 w-4" />
          已超过抢单时间
        </div>
      )}
    </motion.div>
  )
}

export default function GrabPool() {
  const { grabPool, fetchGrabPool, grabCase } = useConsultationStore()
  const { currentUser } = useAuthStore()
  const lawyer = currentUser as Lawyer

  const [selectedTypes, setSelectedTypes] = useState<LegalCaseType[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<Consultation | null>(null)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [grabSuccess, setGrabSuccess] = useState(false)

  useEffect(() => {
    fetchGrabPool()
  }, [fetchGrabPool])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchGrabPool()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleGrabClick = (consultation: Consultation) => {
    setSelectedCase(consultation)
    setConfirmModalOpen(true)
  }

  const handleConfirmGrab = async () => {
    if (!selectedCase || !lawyer) return

    setIsGrabbing(true)
    const result = await grabCase(selectedCase.id, lawyer.id)
    setIsGrabbing(false)

    if (result) {
      setGrabSuccess(true)
      setTimeout(() => {
        setConfirmModalOpen(false)
        setGrabSuccess(false)
        setSelectedCase(null)
      }, 1500)
    }
  }

  const toggleType = (type: LegalCaseType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const filteredCases = useMemo(() => {
    return grabPool.filter((c) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(c.caseType)) return false
      if (selectedRegion && c.region !== selectedRegion) return false
      if (searchKeyword && !c.title.includes(searchKeyword) && !c.description.includes(searchKeyword))
        return false
      return true
    })
  }, [grabPool, selectedTypes, selectedRegion, searchKeyword])

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">抢单大厅</h1>
            <p className="text-slate-500 mt-1">快速响应，承接优质案件</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn('h-4 w-4 text-slate-600', isRefreshing && 'animate-spin')}
            />
            刷新
          </button>
        </div>

        <div className="flex gap-6">
          <div className="w-56 shrink-0 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">案由筛选</h3>
              <div className="space-y-2">
                {caseTypeList.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(item.value)}
                      onChange={() => toggleType(item.value)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              {selectedTypes.length > 0 && (
                <button
                  onClick={() => setSelectedTypes([])}
                  className="mt-4 text-xs text-blue-600 hover:text-blue-700"
                >
                  清除筛选
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">地区筛选</h3>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部地区</option>
                {regionList.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <input
                type="text"
                placeholder="搜索案件关键词..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                共 <span className="font-semibold text-slate-900">{filteredCases.length}</span> 个可抢案件
              </p>
            </div>

            {filteredCases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredCases.map((consultation) => (
                    <GrabCaseCard
                      key={consultation.id}
                      consultation={consultation}
                      onGrab={handleGrabClick}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Gavel className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">暂无符合条件的可抢案件</p>
                <button
                  onClick={handleRefresh}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  刷新列表
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={confirmModalOpen}
        onClose={() => !isGrabbing && setConfirmModalOpen(false)}
        title={grabSuccess ? '抢单成功' : '确认抢单'}
        size="sm"
        footer={
          !grabSuccess ? (
            <>
              <button
                onClick={() => setConfirmModalOpen(false)}
                disabled={isGrabbing}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmGrab}
                disabled={isGrabbing}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGrabbing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    抢单中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    确认抢单
                  </>
                )}
              </button>
            </>
          ) : null
        }
      >
        {grabSuccess ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-4"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-slate-900 mb-1">抢单成功！</p>
            <p className="text-sm text-slate-500">您可以在"我的案件"中查看详情</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">抢单须知</p>
                <p className="text-amber-700">
                  抢单后请在30分钟内响应用户，超时未响应将影响您的信用评级。
                </p>
              </div>
            </div>

            {selectedCase && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {caseTypeMap[selectedCase.caseType]}
                  </span>
                  <span className="text-xs text-slate-500">{selectedCase.region}</span>
                </div>
                <h4 className="font-medium text-slate-900 mb-1">{selectedCase.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-2">{selectedCase.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
