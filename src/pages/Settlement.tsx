import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { Building2, ArrowRightLeft, CheckCircle, Clock, AlertCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Settlement() {
  const { settlementRecords } = useStore()

  const statusIcon: Record<string, React.ReactNode> = {
    completed: <CheckCircle className="w-4 h-4 text-green-600" />,
    processing: <Clock className="w-4 h-4 text-indigo-600" />,
    pending: <AlertCircle className="w-4 h-4 text-blue-600" />,
  }

  return (
    <div>
      <PageHeader
        title="跨市结算通道"
        description="跨城市消费券结算通道配置与管理"
        actions={
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90">
            <ArrowRightLeft className="w-4 h-4" />新建结算申请
          </button>
        }
      />

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700">已连接</span>
                <span className="text-xs text-[#6B7A99]">省级平台连接状态</span>
              </div>
              <p className="text-xs text-[#6B7A99] mt-1">
                最近同步: 2026-06-09 14:30:00 · 累计数据交换 1,284 次
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-[#6B7A99]">待结算</p>
              <p className="text-lg font-bold text-blue-600">
                {settlementRecords.filter((r) => r.status === 'pending').length}
              </p>
            </div>
            <div>
              <p className="text-[#6B7A99]">结算中</p>
              <p className="text-lg font-bold text-indigo-600">
                {settlementRecords.filter((r) => r.status === 'processing').length}
              </p>
            </div>
            <div>
              <p className="text-[#6B7A99]">已完成</p>
              <p className="text-lg font-bold text-green-600">
                {settlementRecords.filter((r) => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card padding={false} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[#6B7A99]">
                <th className="px-5 py-3 font-medium">城市</th>
                <th className="px-5 py-3 font-medium">结算金额</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">申请时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {settlementRecords.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{r.city}</td>
                  <td className="px-5 py-3">¥{r.amount.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon[r.status]}
                      <StatusBadge status={r.status} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#6B7A99]">{r.createdAt}</td>
                  <td className="px-5 py-3">
                    <button className="text-primary text-xs hover:underline">查看详情</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#6B7A99]" />
            </div>
            <div>
              <p className="font-medium text-primary">API 接口配置</p>
              <p className="text-xs text-[#6B7A99] mt-0.5">
                Endpoint: https://api-province.ln.gov.cn/settlement/v2 · 认证方式: OAuth2.0 · 超时: 30s
              </p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg border border-border text-sm text-[#6B7A99] hover:bg-gray-50">
            配置
          </button>
        </div>
      </Card>
    </div>
  )
}
