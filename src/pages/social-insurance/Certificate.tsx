import { useAppStore } from '@/store'
import { getCertificateInfoByCity } from '@/mocks/socialInsurance'
import jsPDF from 'jspdf'
import { useState, useMemo } from 'react'
import { MapPin, Download, CheckCircle, Shield, Clock, QrCode, Eye, FileText, AlertCircle, RotateCcw, ExternalLink } from 'lucide-react'

function QRCodeSVG({ size = 80 }: { size?: number }) {
  const cells = 21
  const cellSize = size / cells
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,0,1,1,1,0,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,1,0,0,0,1,0,0,1,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,1,1,0,0,1,1,1,0,1,1],
    [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,0,0,1,1],
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pattern.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect key={`${y}-${x}`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize} fill="#1A4B8C" />
          ) : null
        )
      )}
    </svg>
  )
}

export default function SocialInsuranceCertificate() {
  const { city, addLog } = useAppStore()
  const certInfo = useMemo(() => getCertificateInfoByCity(city), [city])
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState('')
  const [generatedCertNo, setGeneratedCertNo] = useState('')
  const [generatedTime, setGeneratedTime] = useState('')
  const auditRecords = [
    { label: '文件编号', value: certInfo.certificateNo },
    { label: '生成留痕', value: `${certInfo.generateTime} 已写入操作日志` },
    { label: '验真复查', value: `验证码 ${certInfo.verifyCode} 可在线验真` },
    { label: '下载状态', value: generated ? 'PDF已成功生成并下载' : '待生成，点击后实时更新' },
  ]

  const generatePDF = async () => {
    setGenerating(true)
    setError('')

    try {
      await new Promise((r) => setTimeout(r, 800))

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210

      doc.setTextColor(230, 230, 230)
      doc.setFontSize(28)
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 6; col++) {
          doc.text('YueRenShe', 10 + col * 32, 30 + row * 28, { angle: 45 })
        }
      }

      doc.setTextColor(26, 75, 140)
      doc.setFontSize(18)
      doc.text('Guangdong Social Insurance Participation Certificate', pageW / 2, 22, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`${certInfo.city} Human Resources and Social Security Bureau`, pageW / 2, 28, { align: 'center' })

      doc.setDrawColor(232, 104, 48)
      doc.setLineWidth(0.6)
      doc.line(30, 31, pageW - 30, 31)

      doc.setTextColor(45, 55, 72)
      doc.setFontSize(10)

      const left = 20
      let y = 40
      const rh = 7

      const field = (label: string, value: string, lx: number, vx: number) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, lx, y)
        doc.setFont('helvetica', 'normal')
        doc.text(value, vx, y)
      }

      field('Certificate No:', certInfo.certificateNo, left, left + 32)
      field('City:', `${certInfo.city} (${certInfo.cityCode})`, 115, 130)
      y += rh
      field('Name:', certInfo.userName, left, left + 32)
      field('SSN:', certInfo.socialSecurityNo, 115, 130)
      y += rh
      field('ID Card:', certInfo.idCard, left, left + 32)
      field('Data Source:', certInfo.dataSource, 115, 130)

      y += rh + 2
      doc.setDrawColor(200, 200, 200)
      doc.line(left, y, pageW - 20, y)
      y += 7

      doc.setFont('helvetica', 'bold')
      const hdrs = ['Insurance', 'Status', 'Months', 'Base', 'Company', 'Personal']
      const cw = [28, 22, 18, 26, 26, 26]
      let x = left
      hdrs.forEach((h, i) => { doc.text(h, x, y); x += cw[i] })

      y += 2
      doc.line(left, y, pageW - 20, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      certInfo.insurances.forEach((ins) => {
        x = left
        doc.text(ins.typeName, x, y); x += cw[0]
        doc.text(ins.status, x, y); x += cw[1]
        doc.text(String(ins.months), x, y); x += cw[2]
        doc.text(`Y${ins.baseAmount.toLocaleString()}`, x, y); x += cw[3]
        doc.text(`Y${ins.companyPay.toLocaleString()}`, x, y); x += cw[4]
        doc.text(`Y${ins.personalPay.toLocaleString()}`, x, y)
        y += 6
      })

      y += 3
      doc.line(left, y, pageW - 20, y)
      y += 7

      doc.setFontSize(9)
      doc.text(`Data Source: ${certInfo.dataSource}`, left, y); y += 5
      doc.text(`Generated: ${certInfo.generateTime}`, left, y); y += 5
      doc.text(`Verify Code: ${certInfo.verifyCode}`, left, y); y += 5
      doc.text(`Verify Online: https://hrss.gd.gov.cn/verify/${certInfo.verifyCode}`, left, y)

      y += 12
      doc.setDrawColor(220, 50, 50)
      doc.setLineWidth(1.5)
      doc.ellipse(pageW - 40, y, 14, 14, 'S')
      doc.setLineWidth(0.5)
      doc.ellipse(pageW - 40, y, 12, 12, 'S')
      doc.setFontSize(7)
      doc.setTextColor(220, 50, 50)
      doc.text('Guangdong HRSS', pageW - 40, y - 2, { align: 'center' })
      doc.text('Official Seal', pageW - 40, y + 3, { align: 'center' })

      const now = new Date()
      const fileName = `${certInfo.certificateNo}.pdf`
      doc.save(fileName)

      const timeStr = now.toLocaleString('zh-CN', { hour12: false })
      setGenerated(true)
      setGeneratedCertNo(certInfo.certificateNo)
      setGeneratedTime(timeStr)
      addLog(`生成参保证明PDF（编号：${certInfo.certificateNo}）`, '社保查询')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="gov-section-title">参保证明</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm font-medium">
          <MapPin className="w-3.5 h-3.5" />
          {city}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="gov-card p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="absolute text-[100px] font-serif font-bold text-primary-500 opacity-[0.04] -rotate-25" style={{ top: '15%', left: '5%' }}>粤人社</span>
            <span className="absolute text-[100px] font-serif font-bold text-primary-500 opacity-[0.04] -rotate-25" style={{ top: '45%', right: '0%' }}>粤人社</span>
            <span className="absolute text-[80px] font-serif font-bold text-accent-500 opacity-[0.03] -rotate-25" style={{ bottom: '10%', left: '30%' }}>防伪</span>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-serif font-bold text-primary-800 mb-1">
                广东省社会保险参保证明
              </h1>
              <p className="text-sm text-gov-muted">{city}市人力资源和社会保障局制</p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto mt-3" />
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gov-muted w-20 flex-shrink-0">证明编号：</span>
                <span className="text-gov-text font-mono font-medium">{certInfo.certificateNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-muted w-20 flex-shrink-0">社保编号：</span>
                <span className="text-gov-text font-mono font-medium">{certInfo.socialSecurityNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-muted w-20 flex-shrink-0">姓　　名：</span>
                <span className="text-gov-text font-medium">{certInfo.userName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-muted w-20 flex-shrink-0">身份证号：</span>
                <span className="text-gov-text font-mono font-medium">{certInfo.idCard}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-muted w-20 flex-shrink-0">参保地市：</span>
                <span className="text-gov-text font-medium">{city}市（代码：{certInfo.cityCode}）</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gov-muted w-20 flex-shrink-0">数据来源：</span>
                <span className="text-gov-text font-medium text-xs">{certInfo.dataSource}</span>
              </div>
            </div>

            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="gov-table-header">
                  <th className="px-4 py-2.5 text-left">险种</th>
                  <th className="px-4 py-2.5 text-center">状态</th>
                  <th className="px-4 py-2.5 text-right">缴费月数</th>
                  <th className="px-4 py-2.5 text-right">缴费基数</th>
                  <th className="px-4 py-2.5 text-right">单位缴费</th>
                  <th className="px-4 py-2.5 text-right">个人缴费</th>
                </tr>
              </thead>
              <tbody>
                {certInfo.insurances.map((ins) => (
                  <tr key={ins.typeName} className="gov-table-row">
                    <td className="px-4 py-2.5 text-gov-text font-medium">{ins.typeName}</td>
                    <td className="px-4 py-2.5 text-center"><span className="gov-badge-success">{ins.status}</span></td>
                    <td className="px-4 py-2.5 text-right text-gov-text">{ins.months}个月</td>
                    <td className="px-4 py-2.5 text-right text-gov-text">¥{ins.baseAmount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gov-text">¥{ins.companyPay.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gov-text">¥{ins.personalPay.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gov-border pt-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gov-muted" />
                    <span className="text-gov-muted">生成时间：</span>
                    <span className="text-gov-text">{certInfo.generateTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-gov-muted">验真码：</span>
                    <span className="text-primary-600 font-mono font-bold">{certInfo.verifyCode}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-gov-muted">在线验真：</span>
                    <span className="text-primary-500 underline text-[11px]">https://hrss.gd.gov.cn/verify/{certInfo.verifyCode}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-gov-muted" />
                    <span className="text-gov-muted">扫码验证证明真伪</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-1.5 rounded border border-gov-border">
                      <QRCodeSVG size={72} />
                    </div>
                    <span className="text-[10px] text-gov-muted mt-1">验真二维码</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-[88px] h-[88px] rounded-full flex flex-col items-center justify-center relative"
                      style={{ border: '3px solid #DC2626', color: '#DC2626' }}
                    >
                      <div className="absolute inset-[3px] rounded-full border border-red-300/60" />
                      <span className="font-serif font-bold text-[10px] leading-tight text-center relative z-10">
                        广东省<br />人力<br />资源<br />社保厅
                      </span>
                    </div>
                    <span className="text-[10px] text-gov-muted mt-1">电子签章</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="gov-card p-5 border-l-4 border-primary-400">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary-500" />
              <h3 className="font-semibold text-gov-text">文件生成留痕与后续审计</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {auditRecords.map((record) => (
                <div key={record.label} className="bg-gov-bg rounded-lg p-3">
                  <p className="text-gov-muted text-xs mb-1">{record.label}</p>
                  <p className="text-gov-text font-medium">{record.value}</p>
                </div>
              ))}
            </div>
          </div>

          {!generated && !error && (
            <div className="flex justify-center">
              <button
                onClick={generatePDF}
                disabled={generating}
                className="gov-btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-w-[180px] justify-center"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    正在生成PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    生成PDF并下载
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="gov-card p-5 border-l-4 border-red-400 animate-slide-up">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-gov-error" />
                <h3 className="font-semibold text-gov-error">PDF生成失败</h3>
              </div>
              <p className="text-sm text-gov-muted mb-4">{error}</p>
              <button onClick={generatePDF} className="gov-btn-primary text-sm flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                重新生成
              </button>
            </div>
          )}

          {generated && (
            <div className="gov-card p-6 animate-slide-up border-l-4 border-gov-success">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-7 h-7 text-gov-success" />
                <div>
                  <h3 className="font-semibold text-gov-text text-lg">PDF已成功生成并下载</h3>
                  <p className="text-xs text-gov-muted">文件已保存到本地下载目录</p>
                </div>
              </div>
              <div className="bg-gov-bg rounded-lg p-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  <span className="text-gov-muted">证明编号：</span>
                  <span className="text-gov-text font-mono font-bold">{generatedCertNo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span className="text-gov-muted">生成时间：</span>
                  <span className="text-gov-text">{generatedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  <span className="text-gov-muted">参保地市：</span>
                  <span className="text-gov-text">{city}市</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-500" />
                  <span className="text-gov-muted">防伪验真码：</span>
                  <span className="text-primary-600 font-mono">{certInfo.verifyCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gov-success" />
                  <span className="text-gov-muted">操作留痕：</span>
                  <span className="text-gov-success font-medium">已记录至操作日志</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-800">
                <div className="flex items-center gap-1.5 font-medium mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  证明复查与审计
                </div>
                <p>本证明可通过验真码在线验真，也可前往「操作日志」查看完整生成记录。证明编号唯一，每次生成均留痕可追溯。</p>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setGenerated(false); setError(''); }} className="gov-btn-secondary text-sm flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  再次生成
                </button>
                <button
                  onClick={() => window.location.href = '/admin/logs'}
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  查看留痕记录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
