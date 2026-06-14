import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Upload,
  CreditCard,
  FileBadge,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Camera,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { useAuthStore } from '@/stores/authStore'
import { requestRaw } from '@/utils/api'

type CertStatus = 'none' | 'pending' | 'passed' | 'failed'

interface StatusState {
  id_card: CertStatus
  transport_license: CertStatus
  qualification: CertStatus
  overall: CertStatus
  certification_reason: string
}

const statusLabel: Record<CertStatus, string> = {
  none: '未提交',
  pending: '审核中',
  passed: '已通过',
  failed: '未通过',
}

const statusVariant: Record<CertStatus, 'warning' | 'success' | 'error' | 'info'> = {
  none: 'info',
  pending: 'warning',
  passed: 'success',
  failed: 'error',
}

export default function Certification() {
  const { user, loadUser } = useAuthStore()
  const isDriver = user?.role === 'driver'

  const [status, setStatus] = useState<StatusState>({
    id_card: 'none',
    transport_license: 'none',
    qualification: 'none',
    overall: 'none',
    certification_reason: '',
  })

  // id card
  const [idName, setIdName] = useState('')
  const [idCardNo, setIdCardNo] = useState('')
  const [idLoading, setIdLoading] = useState(false)
  const [idError, setIdError] = useState('')

  // transport license
  const [licenseNo, setLicenseNo] = useState('')
  const [licenseLoading, setLicenseLoading] = useState(false)
  const [licenseError, setLicenseError] = useState('')

  // qualification
  const [qualNo, setQualNo] = useState('')
  const [qualLoading, setQualLoading] = useState(false)
  const [qualError, setQualError] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await requestRaw<{ success: boolean; data: StatusState }>('/api/certification/status', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      setStatus(res.data || status)
    } catch {}
  }

  const submitIdCard = async () => {
    if (!idName || !idCardNo) {
      setIdError('请填写姓名和身份证号')
      return
    }
    if (!/^\d{17}[\dXx]$/.test(idCardNo)) {
      setIdError('身份证号格式不正确')
      return
    }
    setIdLoading(true)
    setIdError('')
    try {
      const token = localStorage.getItem('token')
      await requestRaw('/api/certification/id-card', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: idName, id_card_no: idCardNo.toUpperCase() }),
      })
      setTimeout(async () => {
        await loadStatus()
        await loadUser()
      }, 1500)
    } catch (e: any) {
      setIdError(e.message || '提交失败')
    } finally {
      setIdLoading(false)
    }
  }

  const submitLicense = async () => {
    if (!licenseNo) {
      setLicenseError('请填写道路运输证号')
      return
    }
    setLicenseLoading(true)
    setLicenseError('')
    try {
      const token = localStorage.getItem('token')
      await requestRaw('/api/certification/transport-license', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_no: licenseNo }),
      })
      setTimeout(async () => {
        await loadStatus()
        await loadUser()
      }, 1500)
    } catch (e: any) {
      setLicenseError(e.message || '提交失败')
    } finally {
      setLicenseLoading(false)
    }
  }

  const submitQualification = async () => {
    if (!qualNo) {
      setQualError('请填写从业资格证号')
      return
    }
    setQualLoading(true)
    setQualError('')
    try {
      const token = localStorage.getItem('token')
      await requestRaw('/api/certification/qualification', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualification_no: qualNo }),
      })
      setTimeout(async () => {
        await loadStatus()
        await loadUser()
      }, 1500)
    } catch (e: any) {
      setQualError(e.message || '提交失败')
    } finally {
      setQualLoading(false)
    }
  }

  if (!isDriver) {
    return (
      <div>
        <PageHeader title="实名认证" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ShieldCheck className="h-16 w-16 text-navy-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">货主无需实名认证</h2>
          <p className="text-sm text-gray-500">当前登录角色为货主，实名认证仅针对司机用户</p>
        </div>
      </div>
    )
  }

  const CertHeader = ({ icon: Icon, title, certStatus }: any) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-navy-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-navy-500" />
        </div>
        <span className="text-base font-semibold text-gray-900">{title}</span>
      </div>
      {certStatus === 'passed' ? (
        <div className="flex items-center gap-1 text-mint-600">
          <BadgeCheck className="h-5 w-5" />
          <span className="text-sm font-medium">已认证</span>
        </div>
      ) : certStatus === 'pending' ? (
        <div className="flex items-center gap-1 text-amber-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">AI核验中</span>
        </div>
      ) : certStatus === 'failed' ? (
        <div className="flex items-center gap-1 text-coral-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">核验失败</span>
        </div>
      ) : (
        <StatusBadge variant={statusVariant[certStatus]}>{statusLabel[certStatus]}</StatusBadge>
      )}
    </div>
  )

  return (
    <div>
      <PageHeader title="实名认证" />

      <div className="bg-gradient-to-r from-navy-500 to-navy-600 rounded-xl p-5 text-white mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">认证总进度</p>
            <p className="text-2xl font-bold">
              {status.overall === 'passed' ? '已完成合规认证' : statusLabel[status.overall]}
            </p>
            {status.certification_reason && (
              <p className="text-xs mt-1 opacity-90">提示：{status.certification_reason}</p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              {status.id_card === 'passed' && <CheckCircle2 className="h-6 w-6 text-mint-400" />}
              {status.transport_license === 'passed' && <CheckCircle2 className="h-6 w-6 text-mint-400" />}
              {status.qualification === 'passed' && <CheckCircle2 className="h-6 w-6 text-mint-400" />}
            </div>
            <p className="text-xs opacity-80 mt-1">
              {[status.id_card, status.transport_license, status.qualification].filter(s => s === 'passed').length}/3 项已通过
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <CertHeader icon={CreditCard} title="身份证认证" certStatus={status.id_card} />
          {status.id_card === 'passed' ? (
            <div className="bg-mint-50 border border-mint-100 rounded-lg p-3 text-mint-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              身份证信息已核验通过
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="relative aspect-1.5 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-amber-400 transition-colors cursor-pointer">
                  <Camera className="h-7 w-7 mb-1" />
                  <span className="text-xs">身份证正面</span>
                </div>
                <div className="relative aspect-1.5 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-amber-400 transition-colors cursor-pointer">
                  <Camera className="h-7 w-7 mb-1" />
                  <span className="text-xs">身份证反面</span>
                </div>
              </div>
              <input
                type="text"
                value={idName}
                onChange={e => setIdName(e.target.value)}
                placeholder="姓名（与身份证一致）"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <input
                type="text"
                value={idCardNo}
                onChange={e => setIdCardNo(e.target.value)}
                maxLength={18}
                placeholder="身份证号码（OCR自动识别）"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              {idError && (
                <p className="text-sm text-coral-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {idError}
                </p>
              )}
              <button
                onClick={submitIdCard}
                disabled={idLoading}
                className="w-full py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {idLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {idLoading ? 'AI核验中...' : '提交并OCR识别'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <CertHeader icon={FileBadge} title="道路运输证" certStatus={status.transport_license} />
          {status.transport_license === 'passed' ? (
            <div className="bg-mint-50 border border-mint-100 rounded-lg p-3 text-mint-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              道路运输证已核验通过
            </div>
          ) : (
            <div className="space-y-3">
              <div className="aspect-16/9 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-amber-400 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mb-1" />
                <span className="text-xs">上传道路运输证照片</span>
              </div>
              <input
                type="text"
                value={licenseNo}
                onChange={e => setLicenseNo(e.target.value)}
                placeholder="道路运输证号（OCR自动识别）"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              {licenseError && (
                <p className="text-sm text-coral-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {licenseError}
                </p>
              )}
              <button
                onClick={submitLicense}
                disabled={licenseLoading}
                className="w-full py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {licenseLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {licenseLoading ? 'AI核验中...' : '提交并AI核验'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <CertHeader icon={BadgeCheck} title="从业资格证" certStatus={status.qualification} />
          {status.qualification === 'passed' ? (
            <div className="bg-mint-50 border border-mint-100 rounded-lg p-3 text-mint-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              从业资格证已核验通过
            </div>
          ) : (
            <div className="space-y-3">
              <div className="aspect-16/9 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-amber-400 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mb-1" />
                <span className="text-xs">上传从业资格证照片</span>
              </div>
              <input
                type="text"
                value={qualNo}
                onChange={e => setQualNo(e.target.value)}
                placeholder="从业资格证号（OCR自动识别）"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              {qualError && (
                <p className="text-sm text-coral-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {qualError}
                </p>
              )}
              <button
                onClick={submitQualification}
                disabled={qualLoading}
                className="w-full py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {qualLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {qualLoading ? 'AI核验中...' : '提交并AI核验'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
