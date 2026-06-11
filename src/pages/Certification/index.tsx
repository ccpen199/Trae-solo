import { useState } from 'react'
import { ScanFace, CreditCard, CheckCircle2, ShieldCheck, Clock, MapPin, Info } from 'lucide-react'
import { mockCertificationRecords } from '@/mock/data'
import type { CertificationRecord } from '@/types'

type AuthState = 'idle' | 'scanning' | 'success'

export default function Certification() {
  const [faceState, setFaceState] = useState<AuthState>('idle')
  const [cardState, setCardState] = useState<AuthState>('idle')

  const handleFaceAuth = () => {
    if (faceState !== 'idle') return
    setFaceState('scanning')
    setTimeout(() => setFaceState('success'), 2000)
  }

  const handleCardAuth = () => {
    if (cardState !== 'idle') return
    setCardState('scanning')
    setTimeout(() => setCardState('success'), 2000)
  }

  const statusLabel: Record<CertificationRecord['status'], string> = {
    success: '成功',
    failed: '失败',
    pending: '进行中',
  }

  const statusColor: Record<CertificationRecord['status'], string> = {
    success: 'text-status-success',
    failed: 'text-status-danger',
    pending: 'text-status-warning',
  }

  const typeLabel: Record<CertificationRecord['type'], string> = {
    face: '刷脸认证',
    card: '社保卡认证',
  }

  const lastSuccess = mockCertificationRecords.find((r) => r.status === 'success')

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">待遇资格认证</h1>
        <p className="text-sm text-gray-500 mt-1">生物识别+社保卡芯片双因子认证</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div
          className="gov-card p-8 flex flex-col items-center cursor-pointer gov-card-hover"
          onClick={handleFaceAuth}
        >
          {faceState === 'idle' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 w-[136px] h-[136px] rounded-full border-2 border-gov-blue/20 animate-pulse-slow -translate-x-2 -translate-y-2" />
                <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-gov-blue to-gov-blue-light flex items-center justify-center shadow-lg">
                  <ScanFace className="w-12 h-12 text-white" />
                </div>
              </div>
              <p className="mt-6 text-base font-medium text-gov-blue">点击开始刷脸认证</p>
            </>
          )}
          {faceState === 'scanning' && (
            <>
              <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden bg-gradient-to-br from-gov-blue to-gov-blue-light flex items-center justify-center shadow-lg">
                <ScanFace className="w-12 h-12 text-white" />
                <div className="absolute left-0 right-0 h-0.5 bg-gov-gold animate-scan-line" />
              </div>
              <p className="mt-6 text-base font-medium text-gov-gold">正在识别中...</p>
            </>
          )}
          {faceState === 'success' && (
            <>
              <div className="w-[120px] h-[120px] rounded-full bg-status-success/10 flex items-center justify-center border-2 border-status-success">
                <CheckCircle2 className="w-14 h-14 text-status-success" />
              </div>
              <p className="mt-6 text-base font-medium text-status-success">认证成功</p>
            </>
          )}
        </div>

        <div
          className="gov-card p-8 flex flex-col items-center cursor-pointer gov-card-hover"
          onClick={handleCardAuth}
        >
          {cardState === 'idle' && (
            <>
              <div className="w-[120px] h-[120px] rounded-2xl bg-gradient-to-br from-gov-gold-dark to-gov-gold flex items-center justify-center shadow-lg">
                <CreditCard className="w-12 h-12 text-white" />
              </div>
              <p className="mt-6 text-base font-medium text-gov-blue">请将社保卡放置在读卡器上</p>
            </>
          )}
          {cardState === 'scanning' && (
            <>
              <div className="w-[120px] h-[120px] rounded-2xl bg-gradient-to-br from-gov-gold-dark to-gov-gold flex items-center justify-center shadow-lg animate-pulse">
                <CreditCard className="w-12 h-12 text-white" />
              </div>
              <p className="mt-6 text-base font-medium text-gov-gold">正在读取中...</p>
            </>
          )}
          {cardState === 'success' && (
            <>
              <div className="w-[120px] h-[120px] rounded-2xl bg-status-success/10 flex items-center justify-center border-2 border-status-success">
                <CheckCircle2 className="w-14 h-14 text-status-success" />
              </div>
              <p className="mt-6 text-base font-medium text-status-success">读取成功</p>
            </>
          )}
        </div>
      </div>

      <div className="gov-card p-6 mb-6">
        <h2 className="gov-section-title mb-4">当前认证状态</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gov-blue/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-gov-blue" />
            </div>
            <div>
              <p className="text-xs text-gray-500">最近认证通过</p>
              <p className="text-base font-semibold text-gov-blue">
                {lastSuccess ? lastSuccess.time : '暂无记录'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-status-warning/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-status-warning" />
            </div>
            <div>
              <p className="text-xs text-gray-500">下次到期时间</p>
              <p className="text-base font-semibold text-status-warning">2026-06-01</p>
            </div>
          </div>
        </div>
      </div>

      <div className="gov-card p-6 mb-6">
        <h2 className="gov-section-title mb-4">认证记录</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">认证方式</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">状态</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">时间</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">地点</th>
            </tr>
          </thead>
          <tbody>
            {mockCertificationRecords.map((record) => (
              <tr key={record.id} className="border-b border-gray-50 hover:bg-surface-hover transition-colors">
                <td className="py-3 px-4 font-medium text-gov-blue">{typeLabel[record.type]}</td>
                <td className={`py-3 px-4 font-medium ${statusColor[record.status]}`}>
                  {statusLabel[record.status]}
                </td>
                <td className="py-3 px-4 text-gray-600">{record.time}</td>
                <td className="py-3 px-4 text-gray-600">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                  {record.location}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gov-card p-4 flex items-start gap-3 border-l-4 border-gov-gold">
        <Info className="w-5 h-5 text-gov-gold shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600">
          根据规定，退休人员需每年完成一次待遇资格认证，逾期将暂停待遇发放
        </p>
      </div>
    </div>
  )
}
