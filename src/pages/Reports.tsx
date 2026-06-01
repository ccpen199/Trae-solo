import { useEffect } from 'react'
import { useStore } from '@/store'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const statusMap: Record<string, string> = {
  in_stock: '在库', in_use: '使用中', maintenance: '维护中', retired: '已退役', cascaded: '梯次利用',
}

export default function Reports() {
  const {
    inventoryValue, fetchInventoryValue,
    healthDistribution, fetchHealthDistribution,
    retirementForecast, fetchRetirementForecast,
    supplierQuality, fetchSupplierQuality,
  } = useStore()

  useEffect(() => {
    fetchInventoryValue()
    fetchHealthDistribution()
    fetchRetirementForecast()
    fetchSupplierQuality()
  }, [fetchInventoryValue, fetchHealthDistribution, fetchRetirementForecast, fetchSupplierQuality])

  const sixMonthCount = (retirementForecast?.sixMonths?.warrantyExpiring?.length ?? 0) + (retirementForecast?.sixMonths?.sohCritical?.length ?? 0)
  const twelveMonthCount = (retirementForecast?.twelveMonths?.warrantyExpiring?.length ?? 0) + (retirementForecast?.twelveMonths?.sohCritical?.length ?? 0)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">资产报表</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">库存概览</h3>
          <div className="text-3xl font-bold text-sky-400 mb-2">
            {inventoryValue?.total?.count ?? '-'} <span className="text-sm font-normal text-slate-400">块</span>
          </div>
          <div className="text-lg text-slate-300 mb-4">
            总容量 {inventoryValue?.total?.capacity?.toLocaleString() ?? '-'} Ah
          </div>
          {inventoryValue?.byStatus?.length ? (
            <div className="space-y-2">
              {inventoryValue.byStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{statusMap[item.status] || item.status}</span>
                  <span className="text-white">{item.count} 块 / {item.total_capacity} Ah</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-sm text-center py-4">暂无数据</div>
          )}
        </div>

        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">健康分布（SOH）</h3>
          {healthDistribution?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={healthDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6 }} />
                <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-500 text-sm text-center py-8">暂无数据</div>
          )}
        </div>

        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">退役预测</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">未来6个月预计退役</div>
              <div className="text-2xl font-bold text-amber-400">
                {sixMonthCount} <span className="text-sm font-normal text-slate-400">块</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">未来12个月预计退役</div>
              <div className="text-2xl font-bold text-red-400">
                {twelveMonthCount} <span className="text-sm font-normal text-slate-400">块</span>
              </div>
            </div>
            {retirementForecast?.twelveMonths?.warrantyExpiring?.length ? (
              <div className="mt-3 space-y-1">
                <div className="text-xs text-slate-500">12个月内质保到期：</div>
                {retirementForecast.twelveMonths.warrantyExpiring.map((b) => (
                  <div key={b.id} className="text-xs text-slate-400 flex justify-between">
                    <span>{b.code}</span>
                    <span>质保至 {b.warranty_date}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">供应商质量</h3>
          {supplierQuality?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="text-left py-2 font-medium">供应商</th>
                  <th className="text-right py-2 font-medium">数量</th>
                  <th className="text-right py-2 font-medium">平均SOH</th>
                  <th className="text-right py-2 font-medium">故障率</th>
                </tr>
              </thead>
              <tbody>
                {supplierQuality.map((s) => (
                  <tr key={s.supplier} className="border-t border-slate-700/50">
                    <td className="py-2 text-slate-300">{s.supplier}</td>
                    <td className="py-2 text-right text-slate-300">{s.battery_count}</td>
                    <td className="py-2 text-right text-slate-300">{s.avg_soh.toFixed(1)}%</td>
                    <td className="py-2 text-right">
                      <span className={s.fault_rate > 10 ? 'text-red-400' : s.fault_rate > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {s.fault_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-slate-500 text-sm text-center py-8">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  )
}
