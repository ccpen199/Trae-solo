import { useState } from 'react'
import { useStore } from '@/store'
import StatusBadge from '@/components/StatusBadge'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { Search, Filter, Download, Monitor, QrCode, CreditCard } from 'lucide-react'

const terminalIcon: Record<string, React.ReactNode> = {
  'POS机具': <CreditCard className="w-3.5 h-3.5" />,
  '小程序码': <QrCode className="w-3.5 h-3.5" />,
  '城市码': <Monitor className="w-3.5 h-3.5" />,
}

export default function VerifyRecords() {
  const { verifyRecords } = useStore()
  const [search, setSearch] = useState('')
  const [terminalFilter, setTerminalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = verifyRecords.filter((r) => {
    if (search && !r.couponName.includes(search) && !r.citizenName.includes(search) && !r.merchantName.includes(search) && !r.id.includes(search)) return false
    if (terminalFilter && r.terminal !== terminalFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  })

  return (
    <div>
      <PageHeader title="核销流水" description="全部核销记录查询与管理" actions={<button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:opacity-90"><Download className="w-4 h-4" />导出</button>} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索编号、券名、市民、商户…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B7A99]" />
            <select value={terminalFilter} onChange={(e) => setTerminalFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none">
              <option value="">全部终端</option>
              <option value="POS机具">POS机具</option>
              <option value="小程序码">小程序码</option>
              <option value="城市码">城市码</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none">
              <option value="">全部状态</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[#6B7A99]">
                <th className="px-5 py-3 font-medium">核销编号</th>
                <th className="px-5 py-3 font-medium">券名称</th>
                <th className="px-5 py-3 font-medium">市民</th>
                <th className="px-5 py-3 font-medium">商户</th>
                <th className="px-5 py-3 font-medium">终端</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">时间</th>
                <th className="px-5 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs">{r.id}</td>
                  <td className="px-5 py-3">{r.couponName}</td>
                  <td className="px-5 py-3">{r.citizenName}</td>
                  <td className="px-5 py-3">{r.merchantName}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-[#6B7A99]">
                      {terminalIcon[r.terminal]}{r.terminal}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium">¥{r.amount}</td>
                  <td className="px-5 py-3 text-[#6B7A99] text-xs">{r.verifyTime}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
