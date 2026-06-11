import { useParams } from 'react-router-dom'
import { MapPin, Wrench } from 'lucide-react'
import CreditScore from '@/components/supplier/CreditScore'
import FactoryInspection from '@/components/supplier/FactoryInspection'
import SampleManagement from '@/components/supplier/SampleManagement'
import { useStore } from '@/store'

const typeLabels: Record<string, string> = {
  factory: '加工厂',
  accessory_supplier: '辅料供应商',
  designer: '设计师',
}

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>()
  const suppliers = useStore((s) => s.suppliers)
  const supplier = suppliers.find((s) => s.id === id)

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-navy-400">供应商不存在</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-navy-700">{supplier.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-2.5 py-0.5 bg-navy-50 text-navy-600 text-xs rounded-md">{typeLabels[supplier.type]}</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${supplier.isOnline ? 'status-dot-green' : 'bg-navy-300'}`} />
                <span className="text-xs text-navy-400">{supplier.isOnline ? '在线' : '离线'}</span>
              </div>
              <span className="flex items-center gap-1 text-xs text-navy-400">
                <MapPin size={12} />{supplier.location}
              </span>
            </div>
          </div>
          <div className="ml-auto text-center">
            <p className="text-3xl font-bold text-amber-500 font-serif">{supplier.creditScore}</p>
            <p className="text-xs text-navy-400">综合信用评分</p>
          </div>
        </div>
        {supplier.crafts.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Wrench size={14} className="text-navy-400" />
            <div className="flex flex-wrap gap-1.5">
              {supplier.crafts.map((c) => (
                <span key={c} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded">{c}</span>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-navy-400 mt-3">{supplier.description}</p>
      </div>

      <CreditScore supplier={supplier} />
      <FactoryInspection supplier={supplier} />
      <SampleManagement />
    </div>
  )
}
