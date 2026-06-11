import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { FileCheck, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MerchantAudit() {
  const { auditMerchants } = useStore()

  const pendingCount = auditMerchants.filter((m) => m.status === 'pending').length
  const approvedCount = auditMerchants.filter((m) => m.status === 'approved').length
  const rejectedCount = auditMerchants.filter((m) => m.status === 'rejected').length

  return (
    <div>
      <PageHeader
        title="商户资质审核"
        description="商户入驻资质审核与管理"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">待审核</p>
              <p className="text-xl font-bold text-blue-600">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">已通过</p>
              <p className="text-xl font-bold text-green-600">{approvedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">已驳回</p>
              <p className="text-xl font-bold text-red-600">{rejectedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[#6B7A99]">
                <th className="px-5 py-3 font-medium">商户名称</th>
                <th className="px-5 py-3 font-medium">经营类别</th>
                <th className="px-5 py-3 font-medium">法人</th>
                <th className="px-5 py-3 font-medium">营业执照号</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">提交时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {auditMerchants.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{m.name}</td>
                  <td className="px-5 py-3">{m.category}</td>
                  <td className="px-5 py-3">{m.legalPerson}</td>
                  <td className="px-5 py-3 text-[#6B7A99] font-mono text-xs">{m.licenseNo}</td>
                  <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-5 py-3 text-[#6B7A99]">{m.submittedAt}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {m.status === 'pending' && (
                        <>
                          <button className="text-green-600 text-xs hover:underline">审核通过</button>
                          <button className="text-red-600 text-xs hover:underline">驳回</button>
                        </>
                      )}
                      {m.status !== 'pending' && (
                        <button className="text-primary text-xs hover:underline flex items-center gap-1">
                          <Eye className="w-3 h-3" />查看
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
