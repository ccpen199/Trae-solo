import { useState } from 'react'
import { CheckCircle, FileText, X } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface CompliancePanelProps {
  product: any
}

const complianceChecks = [
  { key: 'license', label: '生产许可证齐全' },
  { key: 'quality', label: '产品质量检验合格' },
  { key: 'noLive', label: '非活体动物' },
  { key: 'standard', label: '符合国家宠物饲料/用品标准' },
]

export default function CompliancePanel({ product }: CompliancePanelProps) {
  const [showReport, setShowReport] = useState(false)

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          合规审查
        </h3>
        <div className="mb-4">
          <StatusBadge
            status="success"
            size="md"
            label={
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                已通过平台合规审查
              </span>
            }
            className="px-4 py-1.5"
          />
        </div>
        <div className="space-y-2 text-sm text-text-secondary">
          <p><span className="font-medium">审批文号：</span>{product.approvalNumber || '京饲审(2024)第00123号'}</p>
          <p><span className="font-medium">检验报告：</span>{product.inspectionReport || '2024-QC-00456'}</p>
          <button
            onClick={() => setShowReport(true)}
            className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 mt-2"
          >
            <FileText className="w-4 h-4" />
            查看合规报告
          </button>
        </div>
        <div className="mt-5 pt-5 border-t border-stone-100">
          <p className="text-sm font-medium text-text-primary mb-3">合规检查清单</p>
          <div className="space-y-2">
            {complianceChecks.map((check) => (
              <div key={check.key} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-text-secondary">{check.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">合规审查报告</h3>
              <button onClick={() => setShowReport(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-emerald-700">产品合规认证通过</p>
                <p className="text-sm text-emerald-600 mt-1">所有检查项均符合国家标准</p>
              </div>
              <div className="space-y-3">
                {complianceChecks.map((check, index) => (
                  <div key={check.key} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                      <span className="text-text-primary">{check.label}</span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-text-secondary pt-4">
                <p>报告编号：{product.inspectionReport || '2024-QC-00456'}</p>
                <p>发证日期：2024-01-01 · 有效期至：2026-01-01</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
