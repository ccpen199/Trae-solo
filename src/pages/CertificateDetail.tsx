import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, QrCode, Clock, ShieldCheck } from 'lucide-react'
import api from '@/lib/api'
import type { Certificate } from '../../shared/types'

const GRADIENT: Record<string, string> = {
  idcard: 'from-blue-500 to-blue-700',
  driver: 'from-amber-700 to-amber-900',
  marriage: 'from-red-500 to-rose-700',
}

const LABEL: Record<string, string> = {
  idcard: '居民身份证',
  driver: '机动车驾驶证',
  marriage: '结婚证',
}

const FIELDS: Record<string, { key: string; label: string }[]> = {
  idcard: [
    { key: 'holder', label: '姓名' },
    { key: 'numberMasked', label: '证件号' },
    { key: 'issueDate', label: '签发日期' },
    { key: 'expireDate', label: '有效期至' },
    { key: 'issueBy', label: '签发机关' },
  ],
  driver: [
    { key: 'holder', label: '姓名' },
    { key: 'numberMasked', label: '证号' },
    { key: 'issueDate', label: '初次领证' },
    { key: 'expireDate', label: '有效期至' },
    { key: 'issueBy', label: '签发机关' },
  ],
  marriage: [
    { key: 'holder', label: '持证人' },
    { key: 'numberMasked', label: '登记编号' },
    { key: 'issueDate', label: '登记日期' },
    { key: 'issueBy', label: '登记机关' },
  ],
}

export default function CertificateDetail() {
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<Certificate | null>(null)
  const [qrData, setQrData] = useState<{ token: string; expireIn: number } | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (!id) return
    api.get<Certificate[]>(`/certificates`).then((res) => {
      const found = res.data.find((c) => c.id === id)
      if (found) setCert(found)
    }).catch(() => {})
  }, [id])

  useEffect(() => {
    if (countdown <= 0 || !qrData) return
    const timer = setInterval(() => setCountdown((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown, qrData])

  const generateVerifyCode = async () => {
    if (!id) return
    try {
      const res = await api.post<{ token: string; expireIn: number }>(`/certificates/${id}/verify`)
      setQrData(res.data)
      setCountdown(res.data.expireIn)
    } catch { /* ignore */ }
  }

  if (!cert) {
    return (
      <div className="max-w-lg mx-auto animate-fadeIn">
        <div className="h-48 rounded-2xl bg-gray-200 animate-shimmer" />
      </div>
    )
  }

  const fields = FIELDS[cert.type] || FIELDS.idcard

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      <Link
        to="/certificates"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回证照列表
      </Link>

      <div className={`rounded-2xl bg-gradient-to-br ${GRADIENT[cert.type]} p-8 text-white shadow-xl mb-6`}>
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6" />
          <span className="font-bold text-lg">{LABEL[cert.type]}</span>
        </div>
        <p className="text-2xl font-bold">{cert.holder}</p>
        <p className="text-sm opacity-80 mt-2">{cert.numberMasked}</p>
        <div className="flex gap-6 mt-4 text-xs opacity-70">
          <span>签发：{cert.issueDate}</span>
          <span>有效期至：{cert.expireDate}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <tbody>
            {fields.map((f) => (
              <tr key={f.key} className="border-b border-gray-50 last:border-0">
                <td className="py-3 px-4 text-text-muted w-24">{f.label}</td>
                <td className="py-3 px-4 text-text-dark font-medium">
                  {(cert as unknown as Record<string, string>)[f.key]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <button
          onClick={generateVerifyCode}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 font-medium hover:bg-primary/90 transition-colors"
        >
          <QrCode className="w-5 h-5" />
          生成核验码
        </button>

        {qrData && countdown > 0 && (
          <div className="mt-6 text-center animate-slideUp">
            <div className="w-40 h-40 mx-auto border-2 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
              <div className="grid grid-cols-6 grid-rows-6 gap-[2px] w-28 h-28">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-[1px] ${Math.random() > 0.3 ? 'bg-primary/80' : 'bg-transparent'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-text-muted">
              <Clock className="w-4 h-4" />
              <span>核验码有效期：{countdown}秒</span>
            </div>
            <p className="text-xs text-text-muted mt-1">请让核验人员扫描此二维码</p>
          </div>
        )}

        {qrData && countdown <= 0 && (
          <div className="mt-4 text-center text-sm text-red-500">
            核验码已过期，请重新生成
          </div>
        )}
      </div>
    </div>
  )
}
