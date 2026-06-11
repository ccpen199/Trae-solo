import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Wrench, Eye, MessageSquare, Package, Building2, ShieldCheck, ChevronDown, ChevronUp, Navigation, Factory, Coins } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import RingProgress from '@/components/RingProgress'
import { useStore } from '@/store'
import type { MatchResult } from '@/store'
import InquiryWizard from '@/components/supplier/InquiryWizard'

const sampleStatusLabel: Record<string, string> = {
  requested: '已请求',
  shipped: '已寄出',
  received: '已收到',
}

const depositStatusLabel: Record<string, string> = {
  pending: '待付',
  paid: '已付',
}

const defaultRequiredCrafts = ['横机编织', '提花', '缝盘', '洗水']

interface MatchResultsProps {
  results: MatchResult[]
}

export default function MatchResults({ results }: MatchResultsProps) {
  const suppliers = useStore((s) => s.suppliers)
  const inquiries = useStore((s) => s.inquiries)
  const updateSupplierSampleStatus = useStore((s) => s.updateSupplierSampleStatus)
  const updateSupplierDepositStatus = useStore((s) => s.updateSupplierDepositStatus)
  const setLastMatchContext = useStore((s) => s.setLastMatchContext)
  const lastMatchRequirements = useStore((s) => s.lastMatchRequirements)

  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string } | null>(null)
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)

  const requiredCrafts = lastMatchRequirements?.crafts?.length ? lastMatchRequirements.crafts : defaultRequiredCrafts

  const handleOpenInquiry = (id: string, name: string, result: MatchResult) => {
    setSelectedSupplier({ id, name })
    setLastMatchContext({ supplierId: id, supplierName: name, dimensions: result.dimensions, score: result.score })
    setInquiryOpen(true)
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {results.map((result) => {
          const supplier = suppliers.find((s) => s.id === result.supplierId)
          if (!supplier) return null

          const inquiryCount = inquiries.filter((i) => i.toSupplierId === supplier.id).length

          const radarData = [
            { dimension: '地理位置', value: result.dimensions.locationScore },
            { dimension: '产能档期', value: result.dimensions.capacityScore },
            { dimension: '工艺能力', value: result.dimensions.craftScore },
            { dimension: '成交价格', value: result.dimensions.priceScore },
          ]

          const sampleActive = supplier.sampleShippingStatus && supplier.sampleShippingStatus !== 'none'
          const depositActive = supplier.depositStatus && supplier.depositStatus !== 'none'

          const distance = Math.round(500 - result.dimensions.locationScore * 4.5)
          const productionCycle = Math.round(35 - result.dimensions.capacityScore * 0.2)
          const capacityUtilization = supplier.capacity.max > 0 ? Math.round(supplier.capacity.current / supplier.capacity.max * 100) : 0

          return (
            <div key={result.supplierId} className="bg-white rounded-lg shadow-sm p-5 card-hover">
              <div className="flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative">
                    <RingProgress value={result.score} size={72} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-amber-500">{result.score}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-navy-400 mt-1">匹配度</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-navy-700 mb-1">{supplier.name}</h3>
                    {inquiryCount > 0 && (
                      <span className="mb-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded">
                        {inquiryCount}条询价
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-navy-400 mb-2">
                    <span className="flex items-center gap-1"><MapPin size={12} />{supplier.location}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${supplier.isOnline ? 'bg-emerald-400 animate-pulse-slow' : 'bg-navy-300'}`} />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {supplier.crafts.slice(0, 4).map((c) => (
                      <span key={c} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] rounded">
                        <Wrench size={8} />{c}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    {sampleActive && (
                      <span className="text-amber-600">样品: {sampleStatusLabel[supplier.sampleShippingStatus!]}</span>
                    )}
                    {depositActive && (
                      <span className="text-amber-600">定金: {depositStatusLabel[supplier.depositStatus!]}</span>
                    )}
                  </div>
                </div>
                <div className="w-32 shrink-0">
                  <ResponsiveContainer width="100%" height={100}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#E8EBF0" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#59708F' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                      <Radar dataKey="value" stroke="#D4A853" fill="#D4A853" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-navy-50">
                <Link to={`/supplier/${supplier.id}`}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-navy-200 rounded-md text-xs text-navy-500 hover:bg-navy-50 transition-colors">
                  <Eye size={12} />查看详情
                </Link>
                <button
                  onClick={() => handleOpenInquiry(supplier.id, supplier.name, result)}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-md text-xs hover:bg-amber-600 transition-colors">
                  <MessageSquare size={12} />发起询价
                </button>
                <button
                  onClick={() => updateSupplierSampleStatus(supplier.id, 'requested')}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-navy-200 rounded-md text-xs text-navy-500 hover:bg-navy-50 transition-colors">
                  <Package size={12} />{sampleActive ? '已请求' : '寄送样品'}
                </button>
                <Link to={`/supplier/${supplier.id}#inspection`}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-navy-200 rounded-md text-xs text-navy-500 hover:bg-navy-50 transition-colors">
                  <Building2 size={12} />在线验厂
                </Link>
                <button
                  onClick={() => updateSupplierDepositStatus(supplier.id, 'pending')}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-navy-200 rounded-md text-xs text-navy-500 hover:bg-navy-50 transition-colors">
                  <ShieldCheck size={12} />{depositActive ? '定金待付' : '担保支付'}
                </button>
              </div>
              <div className="mt-2 pt-2 border-t border-navy-50">
                <button
                  onClick={() => setExpandedMatch(expandedMatch === result.supplierId ? null : result.supplierId)}
                  className="flex items-center gap-1 text-[10px] text-navy-400 hover:text-navy-600 transition-colors"
                >
                  {expandedMatch === result.supplierId ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  匹配依据详情
                </button>
              </div>
              {expandedMatch === result.supplierId && (
                <div className="mt-2 bg-navy-50/50 rounded-lg p-3 space-y-2.5 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <Navigation size={12} className="text-teal-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-medium text-navy-600">地理位置匹配</div>
                      <div className="text-[10px] text-navy-500">
                        距离约{distance}km · {result.dimensions.locationScore >= 90 ? '同区域产业集群，物流1天内可达' : result.dimensions.locationScore >= 70 ? '相邻产业带，物流2-3天' : '跨区域供应，物流3-5天'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Factory size={12} className="text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-medium text-navy-600">产能档期匹配</div>
                      <div className="text-[10px] text-navy-500">
                        可用产能 {supplier.capacity.available}件/月 · 排产周期约{productionCycle}天 · 利用率{capacityUtilization}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Wrench size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-medium text-navy-600 mb-1">工艺能力匹配</div>
                      <div className="flex flex-wrap gap-1">
                        {requiredCrafts.map((craft) => {
                          const matched = supplier.crafts.includes(craft)
                          return (
                            <span key={craft} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded ${
                              matched ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-400 line-through'
                            }`}>
                              {craft}{matched ? ' ✓' : ' ✗'}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Coins size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-medium text-navy-600">历史成交价匹配</div>
                      <div className="text-[10px] text-navy-500">
                        {supplier.historicalPrices && supplier.historicalPrices.length > 0 ? (
                          <>
                            {supplier.historicalPrices.map((p, i) => (
                              <span key={i}>{i > 0 && ' · '}{p.category}均价 ¥{p.avgPrice}</span>
                            ))}
                            {lastMatchRequirements?.budgetRange && lastMatchRequirements.budgetRange[1] > 0 && (
                              <span> · 预算¥{lastMatchRequirements.budgetRange[0]}-{lastMatchRequirements.budgetRange[1]}，{supplier.historicalPrices[0].avgPrice <= lastMatchRequirements.budgetRange[1] ? '在预算范围内' : '略超预算'}</span>
                            )}
                          </>
                        ) : '暂无历史成交数据'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {selectedSupplier && (
        <InquiryWizard
          open={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          supplierId={selectedSupplier.id}
          supplierName={selectedSupplier.name}
        />
      )}
    </div>
  )
}
