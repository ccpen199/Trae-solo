import { useState } from 'react'
import { Warehouse, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { inventoryData } from '@/data/mockData'

export default function Inventory() {
  const [activeStore, setActiveStore] = useState(inventoryData[0].storeId)
  const [syncing, setSyncing] = useState(false)

  const currentStore = inventoryData.find((s) => s.storeId === activeStore)!

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 1500)
  }

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="库存同步" subtitle="各门店库存实时监控与同步" actions={
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? '同步中...' : '同步库存'}
        </button>
      } />

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {inventoryData.map((store) => (
          <button
            key={store.storeId}
            onClick={() => setActiveStore(store.storeId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeStore === store.storeId
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            {store.storeName}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">{currentStore.storeName}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-600">已同步</span>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">当前库存</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">预警阈值</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentStore.products.map((item, i) => {
              const isWarning = item.stock < item.threshold
              return (
                <tr key={i} className={`hover:bg-gray-50 transition-colors ${isWarning ? 'bg-red-50/50' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={isWarning ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{item.threshold}</td>
                  <td className="px-6 py-4 text-center">
                    {isWarning ? (
                      <span className="inline-flex items-center gap-1 badge-danger">
                        <AlertTriangle className="w-3 h-3" />
                        库存预警
                      </span>
                    ) : (
                      <span className="badge-safe">正常</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
