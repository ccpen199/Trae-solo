import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { Banknote, FileText, CheckCircle, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Subsidy() {
  const { subsidyRecords } = useStore()

  const totalAmount = subsidyRecords.reduce((s, r) => s + r.amount, 0)
  const disbursedAmount = subsidyRecords.filter((r) => r.status === 'disbursed').reduce((s, r) => s + r.amount, 0)
  const approvedCount = subsidyRecords.filter((r) => r.status === 'approved').length
  const draftCount = subsidyRecords.filter((r) => r.status === 'draft').length

  const actionLabel: Record<string, string> = {
    draft: '审批',
    approved: '查看',
    disbursed: '查看',
  }

  return (
    <div>
      <PageHeader
        title="财政补贴拨付"
        description="财政补贴资金拨付申请与管理"
        actions={
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90">
            <Plus className="w-4 h-4" />新建拨付申请
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">总拨付金额</p>
              <p className="text-xl font-bold text-primary">¥{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">已拨付</p>
              <p className="text-xl font-bold text-green-600">¥{disbursedAmount.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">待审批</p>
              <p className="text-xl font-bold text-yellow-600">{approvedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">草稿</p>
              <p className="text-xl font-bold text-gray-600">{draftCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[#6B7A99]">
                <th className="px-5 py-3 font-medium">拨付部门</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">用途</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">申请时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {subsidyRecords.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{r.department}</td>
                  <td className="px-5 py-3">¥{r.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[#6B7A99]">{r.purpose}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-[#6B7A99]">{r.createdAt}</td>
                  <td className="px-5 py-3">
                    <button className="text-primary text-xs hover:underline">{actionLabel[r.status]}</button>
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
