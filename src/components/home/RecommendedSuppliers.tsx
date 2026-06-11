import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Star, MapPin, BarChart3, TrendingDown, Truck, FileCheck,
  MessageSquare, Package, Shield, X, Eye, PieChart,
} from 'lucide-react'
import { useStore, type Supplier } from '@/store'
import InquiryWizard from '@/components/supplier/InquiryWizard'
import CreditBreakdownModal from '@/components/supplier/CreditBreakdownModal'

const typeLabels: Record<Supplier['type'], string> = {
  factory: '加工厂',
  accessory_supplier: '辅料商',
  designer: '设计师',
}

const typeTagCls: Record<Supplier['type'], string> = {
  factory: 'bg-blue-50 text-blue-600',
  accessory_supplier: 'bg-teal-50 text-teal-600',
  designer: 'bg-purple-50 text-purple-600',
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-500'
  if (score >= 80) return 'text-blue-500'
  if (score >= 70) return 'text-amber-500'
  return 'text-red-500'
}

function scoreBarColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 80) return 'bg-blue-500'
  if (score >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

const mockDistances: Record<string, number> = {
  '濮院': 168, '大朗': 1280, '义乌': 135, '温州': 380, '桐乡': 65, '苏州': 160,
}

function DimensionBar({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BarChart3 }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={10} className="text-navy-400 shrink-0" />
      <span className="text-[10px] text-navy-400 w-10 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] text-navy-500 w-8 text-right">{value}%</span>
    </div>
  )
}

function FactoryCard({ supplier, onShowCredit }: { supplier: Supplier; onShowCredit: (id: string) => void }) {
  const distance = mockDistances[supplier.location] ?? Math.floor(Math.random() * 800 + 50)
  const capacityPct = supplier.capacity.max > 0 ? Math.round((supplier.capacity.available / supplier.capacity.max) * 100) : 0

  return (
    <div className="min-w-[300px] max-w-[300px] bg-surface rounded-lg p-4 card-hover shrink-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${supplier.isOnline ? 'bg-emerald-400 animate-pulse-slow' : 'bg-navy-300'}`} />
        <h3 className="text-sm font-medium text-navy-700 truncate flex-1">{supplier.name}</h3>
        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${typeTagCls[supplier.type]}`}>
          {typeLabels[supplier.type]}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="text-center shrink-0">
          <p className={`text-2xl font-bold font-serif ${scoreColor(supplier.creditScore)}`}>
            {supplier.creditScore}
          </p>
          <p className="text-[9px] text-navy-400">综合评分</p>
          <button
            onClick={() => onShowCredit(supplier.id)}
            className="mt-1 inline-flex items-center gap-0.5 text-[9px] text-teal-600 hover:text-teal-700 transition-colors"
          >
            <PieChart size={8} />查看评分拆解
          </button>
        </div>
        <div className="flex-1 space-y-1.5">
          <DimensionBar label="履约率" value={Number(supplier.fulfillmentRate.toFixed(1))} icon={FileCheck} />
          <DimensionBar label="质检率" value={Number(supplier.qcPassRate.toFixed(1))} icon={Shield} />
          <DimensionBar label="低客诉" value={Number((100 - supplier.complaintRate).toFixed(1))} icon={TrendingDown} />
        </div>
      </div>

      <div className="space-y-1.5 mb-3 text-xs">
        <div className="flex items-center gap-1.5 text-navy-500">
          <MapPin size={12} className="text-navy-400 shrink-0" />
          <span>{supplier.location}</span>
          <span className="text-navy-300">·</span>
          <span className="text-amber-600">距您{distance}km</span>
        </div>
        <div className="flex items-center gap-1.5 text-navy-500">
          <BarChart3 size={12} className="text-navy-400 shrink-0" />
          <span className="flex-1">可用产能</span>
          <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${capacityPct}%` }} />
          </div>
          <span className="text-[10px] text-navy-400 shrink-0">
            {supplier.capacity.available.toLocaleString()}/{supplier.capacity.max.toLocaleString()}件
          </span>
        </div>
        {supplier.historicalPrices && supplier.historicalPrices.length > 0 && (
          <div className="flex items-center gap-1.5 text-navy-500">
            <Star size={12} className="text-amber-400 shrink-0" />
            {supplier.historicalPrices.slice(0, 2).map((p) => (
              <span key={p.category} className="text-[10px]">
                {p.category}均价¥{p.avgPrice}/件
              </span>
            ))}
          </div>
        )}
      </div>

      {supplier.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {supplier.certifications.map((c) => (
            <span key={c} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] rounded">
              <FileCheck size={8} />{c}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-navy-100">
        <Link
          to={`/supplier/${supplier.id}`}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-navy-50 text-navy-600 rounded hover:bg-navy-100 transition-colors"
        >
          <Eye size={12} />查看详情
        </Link>
      </div>
    </div>
  )
}

function AccessorySupplierCard({ supplier, onInquiry, onShowCredit }: { supplier: Supplier; onInquiry: (id: string) => void; onShowCredit: (id: string) => void }) {
  const distance = mockDistances[supplier.location] ?? Math.floor(Math.random() * 800 + 50)

  return (
    <div className="min-w-[300px] max-w-[300px] bg-surface rounded-lg p-4 card-hover shrink-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${supplier.isOnline ? 'bg-emerald-400 animate-pulse-slow' : 'bg-navy-300'}`} />
        <h3 className="text-sm font-medium text-navy-700 truncate flex-1">{supplier.name}</h3>
        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${typeTagCls[supplier.type]}`}>
          {typeLabels[supplier.type]}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="text-center shrink-0">
          <p className={`text-2xl font-bold font-serif ${scoreColor(supplier.creditScore)}`}>
            {supplier.creditScore}
          </p>
          <p className="text-[9px] text-navy-400">综合评分</p>
          <button
            onClick={() => onShowCredit(supplier.id)}
            className="mt-1 inline-flex items-center gap-0.5 text-[9px] text-teal-600 hover:text-teal-700 transition-colors"
          >
            <PieChart size={8} />查看评分拆解
          </button>
        </div>
        <div className="flex-1 space-y-1.5">
          <DimensionBar label="履约率" value={Number(supplier.fulfillmentRate.toFixed(1))} icon={FileCheck} />
          <DimensionBar label="质检率" value={Number(supplier.qcPassRate.toFixed(1))} icon={Shield} />
          <DimensionBar label="低客诉" value={Number((100 - supplier.complaintRate).toFixed(1))} icon={TrendingDown} />
        </div>
      </div>

      <div className="space-y-1.5 mb-3 text-xs">
        <div className="flex items-center gap-1.5 text-navy-500">
          <MapPin size={12} className="text-navy-400 shrink-0" />
          <span>{supplier.location}</span>
          <span className="text-navy-300">·</span>
          <span className="text-amber-600">距您{distance}km</span>
        </div>
        <div className="flex items-center gap-1.5 text-navy-500">
          <Package size={12} className="text-navy-400 shrink-0" />
          <span>品类数 {supplier.historicalPrices?.length ?? 0}</span>
        </div>
        {supplier.historicalPrices && supplier.historicalPrices.length > 0 && (
          <div className="flex items-center gap-1.5 text-navy-500">
            <Star size={12} className="text-amber-400 shrink-0" />
            {supplier.historicalPrices.slice(0, 2).map((p) => (
              <span key={p.category} className="text-[10px]">
                {p.category}均价¥{p.avgPrice}/{p.avgPrice > 100 ? 'kg' : '件'}
              </span>
            ))}
          </div>
        )}
      </div>

      {supplier.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {supplier.certifications.map((c) => (
            <span key={c} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] rounded">
              <FileCheck size={8} />{c}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-navy-100">
        <Link
          to={`/supplier/${supplier.id}`}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-navy-50 text-navy-600 rounded hover:bg-navy-100 transition-colors"
        >
          <Eye size={12} />查看详情
        </Link>
        <button
          onClick={() => onInquiry(supplier.id)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors"
        >
          <MessageSquare size={12} />发起询价
        </button>
        <button
          onClick={() => onInquiry(supplier.id)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-teal-50 text-teal-600 rounded hover:bg-teal-100 transition-colors"
        >
          <Truck size={12} />寄送样品
        </button>
      </div>
    </div>
  )
}

export default function RecommendedSuppliers() {
  const suppliers = useStore((s) => s.suppliers)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquiryTarget, setInquiryTarget] = useState<{ id: string; name: string } | null>(null)
  const [creditOpen, setCreditOpen] = useState(false)
  const [creditSupplierId, setCreditSupplierId] = useState<string | null>(null)

  const factories = suppliers.filter((s) => s.type === 'factory')
  const accessorySuppliers = suppliers.filter((s) => s.type === 'accessory_supplier')
  const displayed = [...factories.slice(0, 3), ...accessorySuppliers.slice(0, 2)]

  const handleInquiry = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    if (supplier) {
      setInquiryTarget({ id: supplier.id, name: supplier.name })
      setInquiryOpen(true)
    }
  }

  const handleShowCredit = (supplierId: string) => {
    setCreditSupplierId(supplierId)
    setCreditOpen(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-navy-700">推荐供应商</h2>
        <Link to="/market" className="flex items-center gap-0.5 text-xs text-amber-600 hover:text-amber-700 transition-colors">
          查看更多 <span className="text-[10px]">→</span>
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {displayed.map((s) => {
          if (s.type === 'factory') {
            return (
              <div key={s.id} className="relative">
                <FactoryCard supplier={s} onShowCredit={handleShowCredit} />
                <div className="absolute bottom-14 left-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => handleInquiry(s.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors"
                  >
                    <MessageSquare size={12} />发起询价
                  </button>
                  <button
                    onClick={() => handleInquiry(s.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-teal-50 text-teal-600 rounded hover:bg-teal-100 transition-colors"
                  >
                    <Truck size={12} />寄送样品
                  </button>
                </div>
              </div>
            )
          }
          return (
            <AccessorySupplierCard
              key={s.id}
              supplier={s}
              onInquiry={handleInquiry}
              onShowCredit={handleShowCredit}
            />
          )
        })}
      </div>

      {inquiryTarget && (
        <InquiryWizard
          open={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          supplierId={inquiryTarget.id}
          supplierName={inquiryTarget.name}
        />
      )}

      {creditSupplierId && (
        <CreditBreakdownModal
          open={creditOpen}
          onClose={() => setCreditOpen(false)}
          supplierId={creditSupplierId}
        />
      )}
    </div>
  )
}
