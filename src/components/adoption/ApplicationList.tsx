import { useState } from 'react'
import { CheckCircle, XCircle, UserCheck, Home, PawPrint } from 'lucide-react'
import { useAdoptionStore } from '@/stores/adoptionStore'
import StatusBadge from '@/components/StatusBadge'

interface Application {
  id: number
  applicant_id: number
  applicant_name: string
  applicant_avatar: string
  applicant_verified: string
  experience: string
  living_condition: string
  has_other_pets: boolean
  status: string
  created_at: string
}

interface ApplicationListProps {
  applications: Application[]
  adoptionId: number
}

const statusMap: Record<string, { status: string; label: string }> = {
  submitted: { status: 'warning', label: '已提交' },
  approved: { status: 'success', label: '已通过' },
  rejected: { status: 'danger', label: '已拒绝' },
}

export default function ApplicationList({ applications, adoptionId }: ApplicationListProps) {
  const { reviewApplication } = useAdoptionStore()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const handleReview = async (applicationId: number, status: string) => {
    setLoadingId(applicationId)
    try {
      await reviewApplication(adoptionId, applicationId, status)
    } catch (error) {
      console.error('审核失败:', error)
    } finally {
      setLoadingId(null)
    }
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-8 h-8 text-stone-400" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">暂无申请</h3>
        <p className="text-text-secondary">还没有用户申请领养，请耐心等待</p>
      </div>
    )
  }

  const approvedApp = applications.find((a) => a.status === 'approved')

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="heading-font text-lg font-semibold text-text-primary mb-6">
        申请列表 <span className="text-sm font-normal text-text-secondary">({applications.length})</span>
      </h3>
      {approvedApp && (
        <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium text-success">已确认领养人</span>
          </div>
          <p className="text-sm text-text-secondary">
            已选择 <strong>{approvedApp.applicant_name}</strong> 作为领养人，请联系安排线下交接
          </p>
        </div>
      )}
      <div className="space-y-4">
        {applications.map((app) => {
          const statusInfo = statusMap[app.status] || { status: 'info', label: '审核中' }
          const avatar = app.applicant_avatar || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar&image_size=square`

          return (
            <div
              key={app.id}
              className={`p-5 rounded-xl border-2 transition ${
                app.status === 'approved'
                  ? 'border-success bg-success/5'
                  : app.status === 'rejected'
                  ? 'border-stone-200 opacity-60'
                  : 'border-stone-200 hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <img src={avatar} alt={app.applicant_name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{app.applicant_name}</span>
                      {app.applicant_verified === 'verified' && (
                        <span className="text-xs text-success flex items-center gap-0.5">
                          <UserCheck className="w-3 h-3" />
                          已认证
                        </span>
                      )}
                    </div>
                    <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <PawPrint className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary">
                        <span className="font-medium text-text-primary">养宠经验：</span>
                        {app.experience}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary">
                        <span className="font-medium text-text-primary">居住条件：</span>
                        {app.living_condition}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <PawPrint className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary">
                        <span className="font-medium text-text-primary">其他宠物：</span>
                        {app.has_other_pets ? '是' : '否'}
                      </span>
                    </div>
                  </div>
                  {app.status === 'submitted' && !approvedApp && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-stone-200">
                      <button
                        onClick={() => handleReview(app.id, 'approved')}
                        disabled={loadingId === app.id}
                        className="flex-1 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        通过申请
                      </button>
                      <button
                        onClick={() => handleReview(app.id, 'rejected')}
                        disabled={loadingId === app.id}
                        className="flex-1 py-2 bg-stone-200 text-text-primary text-sm font-medium rounded-lg hover:bg-stone-300 transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        拒绝申请
                      </button>
                    </div>
                  )}
                  {app.status === 'approved' && (
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        等待线下交接
                      </p>
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
