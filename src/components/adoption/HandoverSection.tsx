import { useState } from 'react'
import { QrCode, CheckCircle, FileCheck, Shield } from 'lucide-react'
import { useAdoptionStore } from '@/stores/adoptionStore'
import StatusBadge from '@/components/StatusBadge'

interface HandoverSectionProps {
  adoptionId: number
  applicantId: number
  isCompleted: boolean
}

const checklistItems = [
  { label: '宠物健康状况确认', icon: FileCheck },
  { label: '疫苗档案交接', icon: FileCheck },
  { label: '生活用品交接', icon: FileCheck },
  { label: '双方身份核验', icon: Shield },
]

export default function HandoverSection({ adoptionId, applicantId, isCompleted }: HandoverSectionProps) {
  const { confirmHandover } = useAdoptionStore()
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(isCompleted)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await confirmHandover(adoptionId, applicantId)
      setConfirmed(true)
    } catch (error) {
      console.error('确认失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="heading-font text-lg font-semibold text-text-primary mb-4">线下交接确认</h3>
        <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h4 className="font-semibold text-text-primary mb-2">交接已完成</h4>
          <p className="text-sm text-text-secondary">
            线下交接已确认完成，领养信息已同步至农业农村部门备案
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="heading-font text-lg font-semibold text-text-primary mb-4">线下交接确认</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl">
          <div className="w-40 h-40 bg-white rounded-xl shadow-inner flex items-center justify-center mb-4">
            <QrCode className="w-32 h-32 text-text-secondary" />
          </div>
          <p className="text-sm text-text-secondary text-center">
            请双方扫描二维码完成身份核验
          </p>
          <StatusBadge status="warning" label="待扫描" size="md" className="mt-3" />
        </div>
        <div>
          <h4 className="font-medium text-text-primary mb-4">交接清单</h4>
          <div className="space-y-3">
            {checklistItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-primary">{item.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-sm text-text-primary mb-4">
              确认完成以上所有交接事项后，请点击下方按钮完成交接确认。确认后，宠物所有权将正式转移。
            </p>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              确认交接完成
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
