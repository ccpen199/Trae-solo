import { Syringe, FileText, Calendar, Clock, Scan } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VaccineRecord {
  id: number
  vaccine_name: string
  vaccine_type: 'vaccine' | 'deworming' | 'flea_tick'
  vaccine_date: string
  next_date?: string
  hospital?: string
  ocr_image_url?: string
  ocr_confidence?: number
}

const typeConfig = {
  vaccine: { label: '疫苗', className: 'bg-primary/10 text-primary' },
  deworming: { label: '驱虫', className: 'bg-blue-50 text-blue-600' },
  flea_tick: { label: '体外驱虫', className: 'bg-emerald-50 text-emerald-600' },
}

interface VaccineTimelineProps {
  records: VaccineRecord[]
}

export default function VaccineTimeline({ records }: VaccineTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Syringe className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>暂无疫苗驱虫记录</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-stone-200" />
      <div className="space-y-6">
        {records.map((record, index) => {
          const config = typeConfig[record.vaccine_type] || typeConfig.vaccine
          return (
            <div
              key={record.id}
              className={cn(
                'relative pl-12 opacity-0 animate-slideUp',
                `stagger-${Math.min(index + 1, 6)}`
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute left-2 w-5 h-5 rounded-full bg-white border-4 border-primary flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                      config.className
                    )}>
                      <Syringe className="w-3 h-3" />
                      {config.label}
                    </span>
                    {record.ocr_image_url && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                        <Scan className="w-3 h-3" />
                        OCR识别
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-secondary">
                    <Calendar className="w-3 h-3" />
                    {record.vaccine_date}
                  </div>
                </div>

                <h4 className="font-medium text-text-primary mb-2">
                  {record.vaccine_name}
                </h4>

                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  {record.hospital && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {record.hospital}
                    </div>
                  )}
                  {record.next_date && (
                    <div className="flex items-center gap-1 text-primary">
                      <Clock className="w-3.5 h-3.5" />
                      下次: {record.next_date}
                    </div>
                  )}
                  {record.ocr_confidence !== undefined && (
                    <div className="text-xs text-purple-600">
                      置信度: {(record.ocr_confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
