import { useState } from 'react'
import { Upload, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react'
import { api } from '@/utils/api'

type CertType = '建设用地规划许可证' | '建设工程规划许可证' | '建筑工程施工许可证' | '国有土地使用证' | '商品房预售许可证'

const CERT_TYPES: CertType[] = [
  '建设用地规划许可证',
  '建设工程规划许可证',
  '建筑工程施工许可证',
  '国有土地使用证',
  '商品房预售许可证',
]

type OcrState = 'idle' | 'processing' | 'done'
type BureauState = 'idle' | 'processing' | 'done'

type OcrResult = {
  cert_number: string
  issue_date: string
  issue_authority: string
  confidence: number
}

type BureauResult = {
  status: 'match' | 'mismatch' | 'not_found'
  cert_number: string
  issue_date: string
  issue_authority: string
  verify_time: string
}

export default function Verify() {
  const [ocrState, setOcrState] = useState<OcrState>('idle')
  const [ocrCertType, setOcrCertType] = useState<CertType>(CERT_TYPES[0])
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [bureauState, setBureauState] = useState<BureauState>('idle')
  const [bureauCertNumber, setBureauCertNumber] = useState('')
  const [bureauCertType, setBureauCertType] = useState<CertType>(CERT_TYPES[0])
  const [bureauResult, setBureauResult] = useState<BureauResult | null>(null)

  const handleOcr = async () => {
    setOcrState('processing')
    setOcrResult(null)
    try {
      const res = await api.verifyOcr({ type: ocrCertType })
      setOcrResult(res.data)
      setOcrState('done')
    } catch {
      setOcrState('idle')
    }
  }

  const handleBureau = async () => {
    if (!bureauCertNumber.trim()) return
    setBureauState('processing')
    setBureauResult(null)
    try {
      const res = await api.verifyBureau({ cert_number: bureauCertNumber, type: bureauCertType })
      setBureauResult(res.data)
      setBureauState('done')
    } catch {
      setBureauState('idle')
    }
  }

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold text-brand">五证核验</h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-brand">OCR 识别</h2>

            <div className="mt-6">
              <div className="flex h-48 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 transition hover:border-brand hover:bg-brand-50">
                <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-brand-300" />
                  <p className="mt-3 text-sm text-charcoal/50">点击或拖拽上传证照图片</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-charcoal/70">证照类型</label>
              <select
                value={ocrCertType}
                onChange={e => setOcrCertType(e.target.value as CertType)}
                className="mt-1 w-full rounded-lg border border-brand-100 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white"
              >
                {CERT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOcr}
              disabled={ocrState === 'processing'}
              className="mt-5 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {ocrState === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
              开始识别
            </button>

            <div className={`mt-6 transition-all duration-500 ${ocrState === 'done' && ocrResult ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              {ocrResult && (
                <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-brand">识别结果</h3>
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal/50">证号</span>
                      <span className="font-medium">{ocrResult.cert_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/50">发证日期</span>
                      <span className="font-medium">{ocrResult.issue_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/50">发证机关</span>
                      <span className="font-medium">{ocrResult.issue_authority}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-charcoal/50">OCR 置信度</span>
                        <span className="font-bold text-gold">{ocrResult.confidence}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                        <div
                          className="h-full rounded-full bg-gold transition-all duration-700"
                          style={{ width: `${ocrResult.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-brand">住建局核验</h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-charcoal/70">证号</label>
                <input
                  value={bureauCertNumber}
                  onChange={e => setBureauCertNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-100 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="输入证号"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-charcoal/70">证照类型</label>
                <select
                  value={bureauCertType}
                  onChange={e => setBureauCertType(e.target.value as CertType)}
                  className="mt-1 w-full rounded-lg border border-brand-100 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white"
                >
                  {CERT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleBureau}
              disabled={bureauState === 'processing' || !bureauCertNumber.trim()}
              className="mt-5 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {bureauState === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
              核验
            </button>

            <div className={`mt-6 transition-all duration-500 ${bureauState === 'done' && bureauResult ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              {bureauResult && (
                <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-5 space-y-4">
                  <div className="flex items-center justify-center">
                    {bureauResult.status === 'match' && (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-16 w-16 text-emerald-500" />
                        <span className="text-lg font-bold text-emerald-600">核验通过</span>
                      </div>
                    )}
                    {bureauResult.status === 'mismatch' && (
                      <div className="flex flex-col items-center gap-2">
                        <XCircle className="h-16 w-16 text-red-500" />
                        <span className="text-lg font-bold text-red-600">信息不一致</span>
                      </div>
                    )}
                    {bureauResult.status === 'not_found' && (
                      <div className="flex flex-col items-center gap-2">
                        <HelpCircle className="h-16 w-16 text-gray-400" />
                        <span className="text-lg font-bold text-gray-500">未查询到</span>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal/50">证号</span>
                      <span className="font-medium">{bureauResult.cert_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/50">发证日期</span>
                      <span className="font-medium">{bureauResult.issue_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/50">发证机关</span>
                      <span className="font-medium">{bureauResult.issue_authority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/50">核验时间</span>
                      <span className="font-medium">{bureauResult.verify_time}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
